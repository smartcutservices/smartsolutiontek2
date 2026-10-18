import { validateQuestionnaireAnswers } from "./engine.mjs";
import { validateQuestionnaireSchema } from "./schema.mjs";

const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const versionPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const isRecord = (value) => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};
const isStableId = (value) => typeof value === "string" && idPattern.test(value);

function onlyKeys(value, keys, path, errors) {
  for (const key of Object.keys(value)) if (!keys.includes(key)) errors.push(`${path}.${key} is not supported.`);
}

function cloneJsonValue(value, active = new Set(), depth = 0) {
  if (depth > 100) throw new TypeError("Answer nesting is too deep.");
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "object" || active.has(value)) throw new TypeError("Answers must contain only acyclic JSON values.");
  active.add(value);
  try {
    if (Array.isArray(value)) {
      if (Object.getPrototypeOf(value) !== Array.prototype || Object.getOwnPropertySymbols(value).length || Object.getOwnPropertyNames(value).length !== value.length + 1) throw new TypeError("Answer arrays must be dense JSON arrays.");
      const clone = [];
      for (let index = 0; index < value.length; index += 1) {
        const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
        if (!descriptor || !Object.hasOwn(descriptor, "value")) throw new TypeError("Answer arrays cannot contain accessors.");
        clone.push(cloneJsonValue(descriptor.value, active, depth + 1));
      }
      return clone;
    }
    if (!isRecord(value) || Object.getOwnPropertySymbols(value).length) throw new TypeError("Answers must contain plain JSON objects.");
    const clone = {};
    for (const key of Object.keys(value)) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !Object.hasOwn(descriptor, "value")) throw new TypeError("Answer accessors are not supported.");
      Object.defineProperty(clone, key, { value: cloneJsonValue(descriptor.value, active, depth + 1), enumerable: true, configurable: true, writable: true });
    }
    return clone;
  } finally {
    active.delete(value);
  }
}

function cloneAnswers(answers) {
  try {
    const clone = cloneJsonValue(answers);
    return isRecord(clone) ? { ok: true, value: clone } : { ok: false, value: {} };
  } catch {
    return { ok: false, value: {} };
  }
}

/** Validate a chain of declarative migrations. No function or expression is accepted. */
export function validateQuestionnaireMigrations(migrations) {
  if (!Array.isArray(migrations)) return ["Migrations must be an array."];
  const errors = [];
  const migrationIds = new Set();
  const sources = new Set();
  for (const [index, migration] of migrations.entries()) {
    const path = `migrations[${index}]`;
    if (!isRecord(migration)) { errors.push(`${path} must be an object.`); continue; }
    onlyKeys(migration, ["id", "schemaId", "fromVersion", "toVersion", "operations"], path, errors);
    if (!isStableId(migration.id)) errors.push(`${path}.id must be a stable lowercase ID.`);
    else if (migrationIds.has(migration.id)) errors.push(`${path}.id is duplicated.`);
    if (isStableId(migration.id)) migrationIds.add(migration.id);
    if (!isStableId(migration.schemaId)) errors.push(`${path}.schemaId must be a stable lowercase ID.`);
    for (const versionKey of ["fromVersion", "toVersion"]) if (typeof migration[versionKey] !== "string" || !versionPattern.test(migration[versionKey])) errors.push(`${path}.${versionKey} must use semantic version syntax.`);
    if (migration.fromVersion === migration.toVersion) errors.push(`${path} must change the schema version.`);
    const sourceKey = `${migration.schemaId}@${migration.fromVersion}`;
    if (sources.has(sourceKey)) errors.push(`${path} duplicates a migration source version.`);
    sources.add(sourceKey);
    if (!Array.isArray(migration.operations) || migration.operations.length === 0) {
      errors.push(`${path}.operations must contain at least one operation.`);
      continue;
    }
    for (const [operationIndex, operation] of migration.operations.entries()) {
      const operationPath = `${path}.operations[${operationIndex}]`;
      if (!isRecord(operation)) { errors.push(`${operationPath} must be an object.`); continue; }
      if (operation.type === "renameQuestion") {
        onlyKeys(operation, ["type", "fromId", "toId"], operationPath, errors);
        if (!isStableId(operation.fromId) || !isStableId(operation.toId) || operation.fromId === operation.toId) errors.push(`${operationPath} needs distinct stable fromId and toId values.`);
      } else if (operation.type === "dropAnswer") {
        onlyKeys(operation, ["type", "questionId", "reason"], operationPath, errors);
        if (!isStableId(operation.questionId)) errors.push(`${operationPath}.questionId must be a stable lowercase ID.`);
        if (typeof operation.reason !== "string" || !operation.reason.trim()) errors.push(`${operationPath}.reason is required to explain quarantined answers.`);
      } else if (operation.type === "mapOption") {
        onlyKeys(operation, ["type", "questionId", "mapping"], operationPath, errors);
        if (!isStableId(operation.questionId)) errors.push(`${operationPath}.questionId must be a stable lowercase ID.`);
        if (!isRecord(operation.mapping) || Object.keys(operation.mapping).length === 0 || Object.entries(operation.mapping).some(([from, to]) => !isStableId(from) || !isStableId(to))) errors.push(`${operationPath}.mapping must map stable option IDs to stable option IDs.`);
      } else {
        errors.push(`${operationPath}.type is unsupported.`);
      }
    }
  }
  return errors;
}

function failure(answers, code, appliedMigrationIds = []) {
  return { ok: false, code, answers: cloneAnswers(answers).value, orphanedAnswers: {}, appliedMigrationIds };
}

function mapAnswer(answer, mapping) {
  const remap = (value) => Object.hasOwn(mapping, value) ? { ok: true, value: mapping[value] } : { ok: false };
  if (typeof answer === "string") return remap(answer);
  if (Array.isArray(answer)) {
    const values = [];
    for (const item of answer) {
      if (typeof item !== "string") return { ok: false };
      const result = remap(item);
      if (!result.ok) return { ok: false };
      values.push(result.value);
    }
    return { ok: true, value: values };
  }
  return { ok: false };
}

/** Apply a unique version path to a copy of the answers; removed answers are returned for review. */
export function migrateQuestionnaireAnswers({ schemaId, fromVersion, toVersion, answers, migrations }) {
  if (!isStableId(schemaId) || typeof fromVersion !== "string" || !versionPattern.test(fromVersion) || typeof toVersion !== "string" || !versionPattern.test(toVersion) || !isRecord(answers)) return failure(isRecord(answers) ? answers : {}, "invalid-input");
  const clonedAnswers = cloneAnswers(answers);
  if (!clonedAnswers.ok) return failure({}, "invalid-input");
  const migrationErrors = validateQuestionnaireMigrations(migrations);
  if (migrationErrors.length) return failure(clonedAnswers.value, "invalid-migrations");
  if (fromVersion === toVersion) return { ok: true, schemaId, fromVersion, toVersion, answers: clonedAnswers.value, orphanedAnswers: {}, appliedMigrationIds: [] };

  const applicable = migrations.filter((migration) => migration.schemaId === schemaId);
  const bySource = new Map(applicable.map((migration) => [migration.fromVersion, migration]));
  const path = [];
  const seen = new Set([fromVersion]);
  let cursor = fromVersion;
  while (cursor !== toVersion) {
    const migration = bySource.get(cursor);
    if (!migration) return failure(clonedAnswers.value, "migration-path-unavailable");
    if (seen.has(migration.toVersion)) return failure(clonedAnswers.value, "migration-cycle");
    path.push(migration);
    cursor = migration.toVersion;
    seen.add(cursor);
    if (path.length > applicable.length) return failure(clonedAnswers.value, "migration-cycle");
  }

  const migratedAnswers = clonedAnswers.value;
  const orphanedAnswers = {};
  for (const migration of path) {
    for (const operation of migration.operations) {
      if (operation.type === "renameQuestion" && Object.hasOwn(migratedAnswers, operation.fromId)) {
        if (Object.hasOwn(migratedAnswers, operation.toId)) return failure(clonedAnswers.value, "rename-conflict");
        migratedAnswers[operation.toId] = migratedAnswers[operation.fromId];
        delete migratedAnswers[operation.fromId];
      } else if (operation.type === "dropAnswer" && Object.hasOwn(migratedAnswers, operation.questionId)) {
        orphanedAnswers[operation.questionId] = { value: migratedAnswers[operation.questionId], reason: operation.reason, migrationId: migration.id };
        delete migratedAnswers[operation.questionId];
      } else if (operation.type === "mapOption" && Object.hasOwn(migratedAnswers, operation.questionId)) {
        const mapped = mapAnswer(migratedAnswers[operation.questionId], operation.mapping);
        if (!mapped.ok) return failure(clonedAnswers.value, "option-mapping-incomplete");
        migratedAnswers[operation.questionId] = mapped.value;
      }
    }
  }
  return { ok: true, schemaId, fromVersion, toVersion, answers: migratedAnswers, orphanedAnswers, appliedMigrationIds: path.map((migration) => migration.id) };
}

/** Build a read-only migration preview against the target schema; approval/application is separate. */
export function previewQuestionnaireMigration({ schemaId, fromVersion, targetSchema, answers, migrations }) {
  const base = { requiresHumanApproval: true, status: "needs-attention", schemaId, fromVersion, toVersion: targetSchema?.schemaVersion };
  const sourceAnswers = cloneAnswers(answers).value;
  if (!isStableId(schemaId) || !isRecord(targetSchema) || targetSchema.schemaId !== schemaId || typeof targetSchema.schemaVersion !== "string") {
    return { ...base, ok: false, code: "target-schema-mismatch", schemaErrors: [], answerErrors: [], appliedMigrationIds: [], answers: sourceAnswers, orphanedAnswers: {} };
  }
  const schemaErrors = validateQuestionnaireSchema(targetSchema);
  if (schemaErrors.length) return { ...base, ok: false, code: "invalid-target-schema", schemaErrors, answerErrors: [], appliedMigrationIds: [], answers: sourceAnswers, orphanedAnswers: {} };

  const migration = migrateQuestionnaireAnswers({ schemaId, fromVersion, toVersion: targetSchema.schemaVersion, answers, migrations });
  if (!migration.ok) return { ...base, ok: false, code: migration.code, schemaErrors: [], answerErrors: [], appliedMigrationIds: [], answers: migration.answers, orphanedAnswers: migration.orphanedAnswers };

  const answerErrors = validateQuestionnaireAnswers(targetSchema, migration.answers);
  const hasOrphans = Object.keys(migration.orphanedAnswers).length > 0;
  return {
    ...base,
    ok: true,
    status: answerErrors.length || hasOrphans ? "needs-attention" : "ready-for-review",
    requiresHumanApproval: true,
    schemaErrors: [],
    answerErrors,
    appliedMigrationIds: migration.appliedMigrationIds,
    answers: migration.answers,
    orphanedAnswers: migration.orphanedAnswers,
  };
}

/** Record explicit human decisions for a preview; this function does not persist or apply a migration. */
export function resolveQuestionnaireMigrationReview({ preview, targetSchema, approved, orphanDecisions = {}, correctedAnswers }) {
  const unresolvedOrphanIds = [];
  const answerErrors = [];
  if (!isRecord(preview) || preview.ok !== true || preview.requiresHumanApproval !== true) return { ok: false, code: "preview-not-reviewable", answerErrors, unresolvedOrphanIds };
  if (!isRecord(targetSchema) || validateQuestionnaireSchema(targetSchema).length || targetSchema.schemaId !== preview.schemaId || targetSchema.schemaVersion !== preview.toVersion) {
    return { ok: false, code: "target-schema-mismatch", answerErrors, unresolvedOrphanIds };
  }
  if (!isRecord(preview.orphanedAnswers) || !isRecord(preview.answers) || !Array.isArray(preview.appliedMigrationIds)) return { ok: false, code: "invalid-preview", answerErrors, unresolvedOrphanIds };
  const decisionCopy = cloneAnswers(orphanDecisions);
  if (!decisionCopy.ok) return { ok: false, code: "invalid-orphan-decisions", answerErrors, unresolvedOrphanIds };
  const orphanIds = Object.keys(preview.orphanedAnswers);
  const decisionIds = Object.keys(decisionCopy.value);
  const unknownDecisionIds = decisionIds.filter((questionId) => !Object.hasOwn(preview.orphanedAnswers, questionId));
  for (const questionId of orphanIds) if (!Object.hasOwn(decisionCopy.value, questionId) || !["retain", "discard"].includes(decisionCopy.value[questionId])) unresolvedOrphanIds.push(questionId);
  if (unknownDecisionIds.length) return { ok: false, code: "unknown-orphan-decision", answerErrors, unresolvedOrphanIds, unknownDecisionIds };

  const candidateAnswers = correctedAnswers === undefined ? cloneAnswers(preview.answers) : cloneAnswers(correctedAnswers);
  if (!candidateAnswers.ok) return { ok: false, code: "invalid-answer-copy", answerErrors, unresolvedOrphanIds };
  const retainedOrphanedAnswers = {};
  const discardedOrphanIds = [];
  for (const questionId of orphanIds) {
    const item = preview.orphanedAnswers[questionId];
    if (!isStableId(questionId) || !isRecord(item) || !Object.hasOwn(item, "value") || typeof item.reason !== "string" || typeof item.migrationId !== "string") return { ok: false, code: "invalid-orphan-record", answerErrors, unresolvedOrphanIds };
    if (decisionCopy.value[questionId] === "retain") {
      const clone = cloneAnswers({ [questionId]: item });
      if (!clone.ok) return { ok: false, code: "invalid-orphan-record", answerErrors, unresolvedOrphanIds };
      retainedOrphanedAnswers[questionId] = clone.value[questionId];
    }
    else if (decisionCopy.value[questionId] === "discard") discardedOrphanIds.push(questionId);
  }
  answerErrors.push(...validateQuestionnaireAnswers(targetSchema, candidateAnswers.value));
  if (unresolvedOrphanIds.length || answerErrors.length) return { ok: false, code: "review-needs-attention", answerErrors, unresolvedOrphanIds, retainedOrphanedAnswers, discardedOrphanIds };
  if (approved !== true) return { ok: false, code: "human-approval-required", answerErrors, unresolvedOrphanIds, retainedOrphanedAnswers, discardedOrphanIds };
  return {
    ok: true,
    status: "review-approved",
    schemaId: preview.schemaId,
    fromVersion: preview.fromVersion,
    toVersion: preview.toVersion,
    activeAnswers: candidateAnswers.value,
    retainedOrphanedAnswers,
    discardedOrphanIds,
    appliedMigrationIds: [...preview.appliedMigrationIds],
    approved: true,
  };
}
