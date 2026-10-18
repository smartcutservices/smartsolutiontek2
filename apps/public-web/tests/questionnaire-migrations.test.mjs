import assert from "node:assert/strict";
import test from "node:test";
import { migrateQuestionnaireAnswers, previewQuestionnaireMigration, resolveQuestionnaireMigrationReview, validateQuestionnaireMigrations } from "../features/questionnaire/migrations.mjs";

const renameAndMap = [
  { id: "rename-program", schemaId: "registration", fromVersion: "1.0.0", toVersion: "1.1.0", operations: [{ type: "renameQuestion", fromId: "program", toId: "study-program" }] },
  { id: "map-program-choice", schemaId: "registration", fromVersion: "1.1.0", toVersion: "2.0.0", operations: [{ type: "mapOption", questionId: "study-program", mapping: { "old-school": "school", "old-shop": "shop" } }] },
];

function targetSchema() {
  return { schemaId: "registration", schemaVersion: "2.0.0", locale: "fr-HT", questions: [
    { id: "study-program", version: "2.0.0", type: "singleChoice", label: "Programme", required: true, options: [{ id: "school", label: "École" }, { id: "shop", label: "Boutique" }] },
  ] };
}

test("validates an ordered declarative migration chain", () => {
  assert.deepEqual(validateQuestionnaireMigrations(renameAndMap), []);
});

test("applies chained rename and option mapping without mutating the saved source", () => {
  const answers = { program: ["old-school"], "owner-name": "Marie" };
  const result = migrateQuestionnaireAnswers({ schemaId: "registration", fromVersion: "1.0.0", toVersion: "2.0.0", answers, migrations: renameAndMap });
  assert.equal(result.ok, true);
  assert.deepEqual(result.answers, { "study-program": ["school"], "owner-name": "Marie" });
  assert.deepEqual(result.appliedMigrationIds, ["rename-program", "map-program-choice"]);
  assert.deepEqual(answers, { program: ["old-school"], "owner-name": "Marie" });
});

test("quarantines removed answers with a visible reason instead of discarding them", () => {
  const migrations = [{ id: "remove-promo", schemaId: "registration", fromVersion: "1.0.0", toVersion: "1.1.0", operations: [{ type: "dropAnswer", questionId: "promo-code", reason: "The new template no longer supports this field." }] }];
  const result = migrateQuestionnaireAnswers({ schemaId: "registration", fromVersion: "1.0.0", toVersion: "1.1.0", answers: { "promo-code": "SAVE" }, migrations });
  assert.deepEqual(result.answers, {});
  assert.deepEqual(result.orphanedAnswers, { "promo-code": { value: "SAVE", reason: "The new template no longer supports this field.", migrationId: "remove-promo" } });
});

test("reports a missing version path and leaves every original answer unchanged", () => {
  const answers = { program: "old-school" };
  const result = migrateQuestionnaireAnswers({ schemaId: "registration", fromVersion: "1.0.0", toVersion: "3.0.0", answers, migrations: renameAndMap });
  assert.equal(result.ok, false);
  assert.equal(result.code, "migration-path-unavailable");
  assert.deepEqual(result.answers, answers);
});

test("rejects a question rename collision atomically", () => {
  const result = migrateQuestionnaireAnswers({ schemaId: "registration", fromVersion: "1.0.0", toVersion: "1.1.0", answers: { old: "a", next: "b" }, migrations: [{ id: "rename", schemaId: "registration", fromVersion: "1.0.0", toVersion: "1.1.0", operations: [{ type: "renameQuestion", fromId: "old", toId: "next" }] }] });
  assert.equal(result.code, "rename-conflict");
  assert.deepEqual(result.answers, { old: "a", next: "b" });
});

test("refuses to guess when a used option has no explicit mapping", () => {
  const migrations = [{ id: "map-options", schemaId: "registration", fromVersion: "1.0.0", toVersion: "1.1.0", operations: [{ type: "mapOption", questionId: "program", mapping: { "old-school": "school" } }] }];
  const result = migrateQuestionnaireAnswers({ schemaId: "registration", fromVersion: "1.0.0", toVersion: "1.1.0", answers: { program: ["old-school", "old-shop"] }, migrations });
  assert.equal(result.code, "option-mapping-incomplete");
  assert.deepEqual(result.answers, { program: ["old-school", "old-shop"] });
});

test("rejects executable operations and unknown fields on supported operations", () => {
  const invalid = [{ id: "bad", schemaId: "registration", fromVersion: "1.0.0", toVersion: "1.1.0", operations: [{ type: "runCode", source: "globalThis.secret = true" }] }];
  assert.ok(validateQuestionnaireMigrations(invalid).some((error) => error.includes("type is unsupported")));
  const extra = [{ id: "bad", schemaId: "registration", fromVersion: "1.0.0", toVersion: "1.1.0", operations: [{ type: "renameQuestion", fromId: "old", toId: "new", code: "eval('1')" }] }];
  assert.ok(validateQuestionnaireMigrations(extra).some((error) => error.includes(".code is not supported")));
});

test("requires a unique outgoing migration from each schema version", () => {
  const duplicate = [...renameAndMap, { id: "alternate", schemaId: "registration", fromVersion: "1.0.0", toVersion: "1.2.0", operations: [{ type: "renameQuestion", fromId: "program", toId: "course" }] }];
  assert.ok(validateQuestionnaireMigrations(duplicate).some((error) => error.includes("duplicates a migration source version")));
});

test("rejects a cyclic migration path without changing answers", () => {
  const migrations = [
    { id: "to-next", schemaId: "registration", fromVersion: "1.0.0", toVersion: "1.1.0", operations: [{ type: "renameQuestion", fromId: "a", toId: "b" }] },
    { id: "back-to-old", schemaId: "registration", fromVersion: "1.1.0", toVersion: "1.0.0", operations: [{ type: "renameQuestion", fromId: "b", toId: "a" }] },
  ];
  const answers = { a: "kept" };
  const result = migrateQuestionnaireAnswers({ schemaId: "registration", fromVersion: "1.0.0", toVersion: "2.0.0", answers, migrations });
  assert.equal(result.code, "migration-cycle");
  assert.deepEqual(result.answers, answers);
});

test("same-version migration is a safe copy and needs no migration records", () => {
  const answers = { name: "Marie" };
  const result = migrateQuestionnaireAnswers({ schemaId: "registration", fromVersion: "1.0.0", toVersion: "1.0.0", answers, migrations: [] });
  assert.equal(result.ok, true);
  assert.deepEqual(result.answers, answers);
  assert.notEqual(result.answers, answers);
});

test("deep-copies nested answers so edits to the result cannot change the source", () => {
  const answers = { profile: { serviceAreas: ["west"] } };
  const migrations = [{ id: "rename-profile", schemaId: "registration", fromVersion: "1.0.0", toVersion: "1.1.0", operations: [{ type: "renameQuestion", fromId: "profile", toId: "identity" }] }];
  const result = migrateQuestionnaireAnswers({ schemaId: "registration", fromVersion: "1.0.0", toVersion: "1.1.0", answers, migrations });
  result.answers.identity.serviceAreas.push("north");
  assert.deepEqual(answers, { profile: { serviceAreas: ["west"] } });
});

test("rejects cyclic or non-JSON answer values without changing them", () => {
  const answers = { profile: {} };
  answers.profile.self = answers.profile;
  const result = migrateQuestionnaireAnswers({ schemaId: "registration", fromVersion: "1.0.0", toVersion: "1.0.0", answers, migrations: [] });
  assert.equal(result.code, "invalid-input");
  assert.equal(answers.profile.self, answers.profile);
});

test("previews a valid migration against the target schema without applying it", () => {
  const answers = { program: "old-school" };
  const preview = previewQuestionnaireMigration({ schemaId: "registration", fromVersion: "1.0.0", targetSchema: targetSchema(), answers, migrations: renameAndMap });
  assert.equal(preview.ok, true);
  assert.equal(preview.status, "ready-for-review");
  assert.equal(preview.requiresHumanApproval, true);
  assert.deepEqual(preview.answers, { "study-program": "school" });
  assert.deepEqual(preview.answerErrors, []);
  assert.deepEqual(answers, { program: "old-school" });
});

test("rejects a target schema with a mismatched identity or invalid structure", () => {
  const answers = { program: "old-school" };
  const mismatch = previewQuestionnaireMigration({ schemaId: "other-schema", fromVersion: "1.0.0", targetSchema: targetSchema(), answers, migrations: renameAndMap });
  assert.equal(mismatch.code, "target-schema-mismatch");
  assert.deepEqual(mismatch.answers, answers);
  const invalidTarget = targetSchema();
  invalidTarget.questions = [];
  const invalid = previewQuestionnaireMigration({ schemaId: "registration", fromVersion: "1.0.0", targetSchema: invalidTarget, answers, migrations: renameAndMap });
  assert.equal(invalid.code, "invalid-target-schema");
  assert.ok(invalid.schemaErrors.length > 0);
});

test("marks quarantined answers for attention while preserving their review reason", () => {
  const migrations = [{ id: "remove-promo", schemaId: "registration", fromVersion: "1.0.0", toVersion: "2.0.0", operations: [{ type: "dropAnswer", questionId: "promo-code", reason: "The target template has no promotion field." }] }];
  const preview = previewQuestionnaireMigration({ schemaId: "registration", fromVersion: "1.0.0", targetSchema: targetSchema(), answers: { "study-program": "school", "promo-code": "SAVE" }, migrations });
  assert.equal(preview.status, "needs-attention");
  assert.deepEqual(preview.orphanedAnswers["promo-code"], { value: "SAVE", reason: "The target template has no promotion field.", migrationId: "remove-promo" });
});

test("flags answers that do not satisfy the target schema after explicit mapping", () => {
  const migrations = [
    { id: "rename", schemaId: "registration", fromVersion: "1.0.0", toVersion: "1.1.0", operations: [{ type: "renameQuestion", fromId: "program", toId: "study-program" }] },
    { id: "bad-map", schemaId: "registration", fromVersion: "1.1.0", toVersion: "2.0.0", operations: [{ type: "mapOption", questionId: "study-program", mapping: { "old-school": "removed-option" } }] },
  ];
  const preview = previewQuestionnaireMigration({ schemaId: "registration", fromVersion: "1.0.0", targetSchema: targetSchema(), answers: { program: "old-school" }, migrations });
  assert.equal(preview.status, "needs-attention");
  assert.deepEqual(preview.answerErrors, [{ questionId: "study-program", code: "invalid-type" }]);
});

test("keeps file answers blocked on server validation during target preview", () => {
  const fileTarget = { schemaId: "registration", schemaVersion: "1.1.0", locale: "fr", questions: [{ id: "logo", version: "1.0.0", type: "logo", label: "Logo", required: false }] };
  const preview = previewQuestionnaireMigration({ schemaId: "registration", fromVersion: "1.0.0", targetSchema: fileTarget, answers: { logo: { name: "logo.png" } }, migrations: [{ id: "pass-through", schemaId: "registration", fromVersion: "1.0.0", toVersion: "1.1.0", operations: [{ type: "renameQuestion", fromId: "unused", toId: "unused-new" }] }] });
  assert.equal(preview.status, "needs-attention");
  assert.deepEqual(preview.answerErrors, [{ questionId: "logo", code: "server-file-validation-required" }]);
});

test("reports migration failures in preview without altering source answers", () => {
  const answers = { program: "old-school" };
  const preview = previewQuestionnaireMigration({ schemaId: "registration", fromVersion: "0.9.0", targetSchema: targetSchema(), answers, migrations: renameAndMap });
  assert.equal(preview.ok, false);
  assert.equal(preview.code, "migration-path-unavailable");
  assert.deepEqual(preview.answers, answers);
});

test("does not approve a valid preview without an explicit human decision", () => {
  const preview = previewQuestionnaireMigration({ schemaId: "registration", fromVersion: "1.0.0", targetSchema: targetSchema(), answers: { program: "old-school" }, migrations: renameAndMap });
  const result = resolveQuestionnaireMigrationReview({ preview, targetSchema: targetSchema(), approved: false });
  assert.equal(result.code, "human-approval-required");
});

test("requires an explicit retain-or-discard decision for every orphaned answer", () => {
  const migrations = [{ id: "remove-promo", schemaId: "registration", fromVersion: "1.0.0", toVersion: "2.0.0", operations: [{ type: "dropAnswer", questionId: "promo-code", reason: "Field removed." }] }];
  const preview = previewQuestionnaireMigration({ schemaId: "registration", fromVersion: "1.0.0", targetSchema: targetSchema(), answers: { "study-program": "school", "promo-code": "SAVE" }, migrations });
  const result = resolveQuestionnaireMigrationReview({ preview, targetSchema: targetSchema(), approved: true });
  assert.equal(result.code, "review-needs-attention");
  assert.deepEqual(result.unresolvedOrphanIds, ["promo-code"]);
});

test("retains or explicitly discards each orphan without changing the preview", () => {
  const migrations = [{ id: "remove-old-fields", schemaId: "registration", fromVersion: "1.0.0", toVersion: "2.0.0", operations: [
    { type: "dropAnswer", questionId: "old-note", reason: "No longer supported." },
    { type: "dropAnswer", questionId: "old-code", reason: "No longer supported." },
  ] }];
  const original = { "study-program": "school", "old-note": { text: "Keep for reference" }, "old-code": "DELETE-ME" };
  const preview = previewQuestionnaireMigration({ schemaId: "registration", fromVersion: "1.0.0", targetSchema: targetSchema(), answers: original, migrations });
  const result = resolveQuestionnaireMigrationReview({ preview, targetSchema: targetSchema(), approved: true, orphanDecisions: { "old-note": "retain", "old-code": "discard" } });
  assert.equal(result.ok, true);
  assert.deepEqual(result.activeAnswers, { "study-program": "school" });
  assert.deepEqual(result.retainedOrphanedAnswers["old-note"].value, { text: "Keep for reference" });
  assert.deepEqual(result.discardedOrphanIds, ["old-code"]);
  assert.deepEqual(preview.answers, { "study-program": "school" });
  assert.deepEqual(original, { "study-program": "school", "old-note": { text: "Keep for reference" }, "old-code": "DELETE-ME" });
});

test("blocks approval until corrected answers satisfy the target schema", () => {
  const badMap = [
    { id: "rename", schemaId: "registration", fromVersion: "1.0.0", toVersion: "1.1.0", operations: [{ type: "renameQuestion", fromId: "program", toId: "study-program" }] },
    { id: "bad-map", schemaId: "registration", fromVersion: "1.1.0", toVersion: "2.0.0", operations: [{ type: "mapOption", questionId: "study-program", mapping: { "old-school": "removed-option" } }] },
  ];
  const preview = previewQuestionnaireMigration({ schemaId: "registration", fromVersion: "1.0.0", targetSchema: targetSchema(), answers: { program: "old-school" }, migrations: badMap });
  const blocked = resolveQuestionnaireMigrationReview({ preview, targetSchema: targetSchema(), approved: true });
  assert.equal(blocked.code, "review-needs-attention");
  assert.deepEqual(blocked.answerErrors, [{ questionId: "study-program", code: "invalid-type" }]);
  const corrected = resolveQuestionnaireMigrationReview({ preview, targetSchema: targetSchema(), approved: true, correctedAnswers: { "study-program": "school" } });
  assert.equal(corrected.ok, true);
  assert.deepEqual(corrected.activeAnswers, { "study-program": "school" });
});

test("refuses review against a different target schema version", () => {
  const preview = previewQuestionnaireMigration({ schemaId: "registration", fromVersion: "1.0.0", targetSchema: targetSchema(), answers: { program: "old-school" }, migrations: renameAndMap });
  const changedTarget = targetSchema();
  changedTarget.schemaVersion = "3.0.0";
  const result = resolveQuestionnaireMigrationReview({ preview, targetSchema: changedTarget, approved: true });
  assert.equal(result.code, "target-schema-mismatch");
});

test("does not resolve a failed migration preview", () => {
  const preview = previewQuestionnaireMigration({ schemaId: "registration", fromVersion: "0.9.0", targetSchema: targetSchema(), answers: { program: "old-school" }, migrations: renameAndMap });
  const result = resolveQuestionnaireMigrationReview({ preview, targetSchema: targetSchema(), approved: true });
  assert.equal(result.code, "preview-not-reviewable");
});

test("rejects decision IDs that do not belong to the preview", () => {
  const preview = previewQuestionnaireMigration({ schemaId: "registration", fromVersion: "1.0.0", targetSchema: targetSchema(), answers: { program: "old-school" }, migrations: renameAndMap });
  const result = resolveQuestionnaireMigrationReview({ preview, targetSchema: targetSchema(), approved: true, orphanDecisions: { "not-an-orphan": "discard" } });
  assert.equal(result.code, "unknown-orphan-decision");
});
