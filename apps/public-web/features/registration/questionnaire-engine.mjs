const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const isAnswered = (answers, fieldId) => hasOwn(answers, fieldId) && answers[fieldId] !== undefined && answers[fieldId] !== null && answers[fieldId] !== "";

function isVisible(field, fieldsById, answers) {
  if (!field.showWhen) return true;
  const parent = fieldsById.get(field.showWhen.fieldId);
  return Boolean(parent && isVisible(parent, fieldsById, answers) && answers[parent.id] === field.showWhen.optionId);
}

/**
 * Applies a change to a draft answer map and removes answers for fields that
 * are no longer applicable. This is a pure local helper; it does not persist
 * answers or accept/submit applicant data.
 */
export function reconcileQuestionnaireAnswers(config, currentAnswers, changedFieldId, nextValue) {
  const fields = config?.application?.fields;
  if (!Array.isArray(fields) || !fields.some((field) => field?.id === changedFieldId)) {
    return { answers: { ...currentAnswers }, visibleFieldIds: [], currentQuestionId: null, error: "Unknown questionnaire field." };
  }

  const answers = { ...currentAnswers, [changedFieldId]: nextValue };
  const fieldsById = new Map(fields.map((field) => [field.id, field]));
  const visibleFields = fields.filter((field) => isVisible(field, fieldsById, answers));
  const visibleFieldIds = new Set(visibleFields.map((field) => field.id));
  for (const fieldId of Object.keys(answers)) {
    if (!visibleFieldIds.has(fieldId)) delete answers[fieldId];
  }

  return {
    answers,
    visibleFieldIds: visibleFields.map((field) => field.id),
    currentQuestionId: visibleFields.find((field) => !isAnswered(answers, field.id))?.id ?? null,
    error: null,
  };
}

/** Returns the visible card sequence and the next unanswered card. */
export function getQuestionnaireProgress(config, answers) {
  const fields = config?.application?.fields;
  if (!Array.isArray(fields)) return { visibleFieldIds: [], currentQuestionId: null, answeredCount: 0, total: 0 };
  const fieldsById = new Map(fields.map((field) => [field.id, field]));
  const visibleFields = fields.filter((field) => isVisible(field, fieldsById, answers));
  const answered = (field) => isAnswered(answers, field.id);
  return {
    visibleFieldIds: visibleFields.map((field) => field.id),
    currentQuestionId: visibleFields.find((field) => !answered(field))?.id ?? null,
    answeredCount: visibleFields.filter(answered).length,
    total: visibleFields.length,
  };
}

/** Validates values for the currently visible draft cards; no server trust implied. */
export function validateQuestionnaireAnswers(config, answers) {
  const fields = config?.application?.fields;
  if (!Array.isArray(fields)) return [{ fieldId: null, code: "invalid-config" }];
  const fieldsById = new Map(fields.map((field) => [field.id, field]));
  const errors = [];
  for (const field of fields) {
    if (!isVisible(field, fieldsById, answers)) continue;
    const value = answers[field.id];
    const empty = value === undefined || value === null || value === "" || (field.type === "checkbox" && field.required && value !== true);
    if (empty) {
      if (field.required) errors.push({ fieldId: field.id, code: "required" });
      continue;
    }
    if (field.type === "text" && (typeof value !== "string" || !value.trim())) errors.push({ fieldId: field.id, code: "invalid-text" });
    if (field.type === "email" && (typeof value !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))) errors.push({ fieldId: field.id, code: "invalid-email" });
    if (field.type === "tel" && (typeof value !== "string" || !/^[+()\d .-]{7,30}$/.test(value))) errors.push({ fieldId: field.id, code: "invalid-phone" });
    if (field.type === "date" && (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`)) || new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value)) errors.push({ fieldId: field.id, code: "invalid-date" });
    if (field.type === "select" && (typeof value !== "string" || !field.options?.some((option) => option.id === value))) errors.push({ fieldId: field.id, code: "invalid-option" });
    if (field.type === "checkbox" && typeof value !== "boolean") errors.push({ fieldId: field.id, code: "invalid-checkbox" });
    if (field.type === "file") errors.push({ fieldId: field.id, code: "file-validation-requires-server" });
  }
  return errors;
}
