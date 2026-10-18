import { getQuestionnaireProgress } from "../questionnaire/engine.mjs";

export function isQuestionnaireAnswerRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isRecord(value) { return typeof value === "object" && value !== null && !Array.isArray(value); }

function isCompatibleAnswer(question, value) {
  const optionIds = new Set(Array.isArray(question.options) ? question.options.map((option) => option.id) : []);
  if (["shortText", "longText", "email", "phone", "date", "dateTime", "color"].includes(question.type)) return typeof value === "string";
  if (question.type === "number") return typeof value === "number" && Number.isFinite(value) || typeof value === "string";
  if (question.type === "amount") return isRecord(value) && Object.keys(value).length === 2 && typeof value.value === "string" && typeof value.currency === "string";
  if (question.type === "yesNo") return typeof value === "boolean";
  if (["singleChoice", "font", "geographicArea", "sectionChoice"].includes(question.type)) return typeof value === "string" && optionIds.has(value);
  if (["multipleChoice", "order"].includes(question.type)) return Array.isArray(value) && value.every((item) => typeof item === "string" && optionIds.has(item)) && new Set(value).size === value.length;
  if (question.type === "address") return isRecord(value) && Object.keys(value).every((key) => ["line1", "line2", "district", "city", "region", "postalCode", "countryCode"].includes(key) && typeof value[key] === "string");
  if (question.type === "repeatableList") return Array.isArray(value) && value.every((item) => isRecord(item) && Object.values(item).every((part) => ["string", "number", "boolean"].includes(typeof part) && (typeof part !== "number" || Number.isFinite(part))));
  // Files need a server-issued object ID and must never be copied into localStorage.
  return false;
}

/** Keep editable incomplete text, remove incompatible values, and prune hidden answers. */
export function sanitizeSectorDraftAnswers(schema, answers) {
  const questions = new Map(schema.questions.map((question) => [question.id, question]));
  const compatible = Object.fromEntries(Object.entries(answers).filter(([id, value]) => {
    const question = questions.get(id);
    return question !== undefined && isCompatibleAnswer(question, value);
  }));
  const visibleIds = new Set(getQuestionnaireProgress(schema, compatible).visibleQuestionIds);
  const sanitized = Object.fromEntries(Object.entries(compatible).filter(([id]) => visibleIds.has(id)));
  return { answers: sanitized, changed: Object.keys(sanitized).length !== Object.keys(answers).length };
}

/** Only known additive sector-schema migrations are automatic. */
const additiveSectorMigrations = Object.freeze({
  "1.0.0": new Set(["1.1.0", "1.2.0", "1.3.0", "1.4.0", "1.5.0", "1.6.0", "1.7.0", "1.8.0", "1.9.0", "1.10.0", "1.11.0"]),
  "1.1.0": new Set(["1.2.0", "1.3.0", "1.4.0", "1.5.0", "1.6.0", "1.7.0", "1.8.0", "1.9.0", "1.10.0", "1.11.0"]),
  "1.2.0": new Set(["1.3.0", "1.4.0", "1.5.0", "1.6.0", "1.7.0", "1.8.0", "1.9.0", "1.10.0", "1.11.0"]),
  "1.3.0": new Set(["1.4.0", "1.5.0", "1.6.0", "1.7.0", "1.8.0", "1.9.0", "1.10.0", "1.11.0"]),
  "1.4.0": new Set(["1.5.0", "1.6.0", "1.7.0", "1.8.0", "1.9.0", "1.10.0", "1.11.0"]),
  "1.5.0": new Set(["1.6.0", "1.7.0", "1.8.0", "1.9.0", "1.10.0", "1.11.0"]),
  "1.6.0": new Set(["1.7.0", "1.8.0", "1.9.0", "1.10.0", "1.11.0"]),
  "1.7.0": new Set(["1.8.0", "1.9.0", "1.10.0", "1.11.0"]),
  "1.8.0": new Set(["1.9.0", "1.10.0", "1.11.0"]),
  "1.9.0": new Set(["1.10.0", "1.11.0"]),
  "1.10.0": new Set(["1.11.0"]),
});
export function supportsSectorDraftMigration(fromVersion, toVersion) {
  return fromVersion === toVersion || additiveSectorMigrations[fromVersion]?.has(toVersion) === true;
}

/** A newer edit from an older base conflicts with the local revision. */
export function hasConcurrentSectorDraftEdit({ dirty, localUpdatedAt, incomingUpdatedAt, incomingBasedOnUpdatedAt }) {
  return dirty || (localUpdatedAt > 0 && incomingUpdatedAt > localUpdatedAt && incomingBasedOnUpdatedAt < localUpdatedAt);
}

export function createSectorDraftRecord({ schemaId, schemaVersion, answers, updatedAt, basedOnUpdatedAt, tabId, deleted = false }) {
  return {
    schemaId,
    schemaVersion,
    answers: { ...answers },
    updatedAt,
    basedOnUpdatedAt,
    tabId,
    ...(deleted ? { deleted: true } : {}),
  };
}
