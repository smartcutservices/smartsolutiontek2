function isAnswered(value, depth = 0) {
  if (depth > 16) return false;
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.some((item) => isAnswered(item, depth + 1));
  if (typeof value === "object") {
    if (Object.hasOwn(value, "value") && Object.hasOwn(value, "currency")) return isAnswered(value.value, depth + 1);
    return Object.values(value).some((item) => isAnswered(item, depth + 1));
  }
  return true;
}

function matches(rule, answers) {
  const actual = answers[rule.questionId];
  if (rule.operator === "answered") return isAnswered(actual);
  if (!isAnswered(actual)) return false;
  if (rule.operator === "equals") return actual === rule.value;
  if (rule.operator === "notEquals") return actual !== rule.value;
  if (rule.operator === "contains") return Array.isArray(actual) && actual.includes(rule.value);
  return false;
}

function visible(question, questionsById, answers, cache, visiting = new Set()) {
  if (cache.has(question.id)) return cache.get(question.id);
  if (visiting.has(question.id)) return false;
  visiting.add(question.id);
  const rules = question.visibilityRules ?? [];
  if (!Array.isArray(rules) || rules.some((rule) => typeof rule !== "object" || rule === null || Array.isArray(rule))) {
    visiting.delete(question.id);
    cache.set(question.id, false);
    return false;
  }
  const result = rules.every((rule) => {
    const source = questionsById.get(rule.questionId);
    return Boolean(source && visible(source, questionsById, answers, cache, visiting) && matches(rule, answers));
  });
  visiting.delete(question.id);
  cache.set(question.id, result);
  return result;
}

function required(question, questionsById, answers) {
  if (question.required) return true;
  const conditions = question.requiredWhen ?? [];
  if (!Array.isArray(conditions) || conditions.length === 0 || conditions.some((rule) => typeof rule !== "object" || rule === null || Array.isArray(rule))) return false;
  const cache = new Map();
  return conditions.every((rule) => {
    const source = questionsById.get(rule.questionId);
    return Boolean(source && visible(source, questionsById, answers, cache) && matches(rule, answers));
  });
}

function isPlainRecord(value) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isIsoDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const timestamp = Date.parse(`${value}T00:00:00.000Z`);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value;
}

function hasValidShape(question, value) {
  const options = new Set(Array.isArray(question.options) ? question.options.filter((option) => option && typeof option.id === "string").map((option) => option.id) : []);
  const stringValue = typeof value === "string";
  switch (question.type) {
    case "shortText":
    case "longText":
      return stringValue && value.trim().length > 0;
    case "email":
      return stringValue && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    case "phone":
      return stringValue && /^[+()\d .-]{7,30}$/.test(value) && (value.match(/\d/g)?.length ?? 0) >= 7;
    case "number":
      return typeof value === "number" && Number.isFinite(value);
    case "amount":
      return isPlainRecord(value) && Object.keys(value).length === 2 && typeof value.currency === "string" && /^[A-Z]{3}$/.test(value.currency) && typeof value.value === "string" && value.value.length <= 32 && /^(?:0|[1-9]\d*)(?:\.\d{1,8})?$/.test(value.value) && Number.isFinite(Number(value.value));
    case "singleChoice":
    case "font":
    case "geographicArea":
    case "sectionChoice":
      return stringValue && options.has(value);
    case "multipleChoice":
      return Array.isArray(value) && value.every((item) => typeof item === "string" && options.has(item)) && new Set(value).size === value.length;
    case "order":
      return Array.isArray(value) && value.length === options.size && value.every((item) => typeof item === "string" && options.has(item)) && new Set(value).size === value.length;
    case "yesNo":
      return typeof value === "boolean";
    case "date":
      return isIsoDate(value);
    case "dateTime":
      return stringValue && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) && isIsoDate(value.slice(0, 10)) && Number.isFinite(Date.parse(value));
    case "color":
      return stringValue && /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value);
    case "address":
      return isPlainRecord(value) && Object.keys(value).length > 0 && Object.keys(value).every((key) => ["line1", "line2", "district", "city", "region", "postalCode", "countryCode"].includes(key) && typeof value[key] === "string") && Object.values(value).some((part) => part.trim().length > 0) && (value.countryCode === undefined || /^[A-Z]{2}$/.test(value.countryCode));
    case "repeatableList":
      return Array.isArray(value) && value.every((item) => isPlainRecord(item) && Object.keys(item).length > 0 && Object.values(item).every((part) => ["string", "number", "boolean"].includes(typeof part) && (typeof part !== "number" || Number.isFinite(part)) && (typeof part !== "string" || part.trim().length > 0)));
    case "file":
    case "image":
    case "logo":
      return false;
    default:
      return false;
  }
}

function isEmpty(value) {
  return value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);
}

/** Count meaningful answers that a branch change would remove from the active draft. */
export function countDiscardedAnsweredQuestions(schema, previousAnswers, nextAnswers) {
  if (!Array.isArray(schema?.questions) || !isPlainRecord(previousAnswers) || !isPlainRecord(nextAnswers)) return 0;
  return Object.keys(previousAnswers).reduce((count, questionId) => count + (
    !Object.hasOwn(nextAnswers, questionId) && isAnswered(previousAnswers[questionId]) ? 1 : 0
  ), 0);
}

/** Validate visible answers locally. File validation must be repeated by a trusted server. */
export function validateQuestionnaireAnswers(schema, answers) {
  if (!Array.isArray(schema?.questions) || schema.questions.some((question) => !question || typeof question.id !== "string") || new Set(schema.questions.map((question) => question.id)).size !== schema.questions.length || !isPlainRecord(answers)) return [{ questionId: null, code: "invalid-input" }];
  const progress = getQuestionnaireProgress(schema, answers);
  const visibleIds = new Set(progress.visibleQuestionIds);
  const questionsById = new Map(schema.questions.map((question) => [question.id, question]));
  const errors = [];
  for (const questionId of Object.keys(answers)) {
    if (!questionsById.has(questionId)) errors.push({ questionId, code: "unknown-question" });
    else if (!visibleIds.has(questionId)) errors.push({ questionId, code: "inapplicable-answer" });
  }
  for (const question of schema.questions) {
    if (!visibleIds.has(question.id)) continue;
    const value = answers[question.id];
    if (isEmpty(value)) {
      if (required(question, questionsById, answers)) errors.push({ questionId: question.id, code: "required" });
      else if (Array.isArray(value) && question.validation?.minItems > 0) errors.push({ questionId: question.id, code: "min-items" });
      continue;
    }
    if (["file", "image", "logo"].includes(question.type)) {
      errors.push({ questionId: question.id, code: "server-file-validation-required" });
      continue;
    }
    if (!hasValidShape(question, value)) {
      errors.push({ questionId: question.id, code: "invalid-type" });
      continue;
    }
    const bounds = question.validation ?? {};
    if (["shortText", "longText", "email", "phone"].includes(question.type) && bounds.minLength !== undefined && value.length < bounds.minLength) errors.push({ questionId: question.id, code: "min-length" });
    if (["shortText", "longText", "email", "phone"].includes(question.type) && bounds.maxLength !== undefined && value.length > bounds.maxLength) errors.push({ questionId: question.id, code: "max-length" });
    if (question.type === "number" && bounds.min !== undefined && value < bounds.min) errors.push({ questionId: question.id, code: "min-value" });
    if (question.type === "number" && bounds.max !== undefined && value > bounds.max) errors.push({ questionId: question.id, code: "max-value" });
    const itemCount = Array.isArray(value) ? value.length : null;
    if (itemCount !== null && bounds.minItems !== undefined && itemCount < bounds.minItems) errors.push({ questionId: question.id, code: "min-items" });
    if (itemCount !== null && bounds.maxItems !== undefined && itemCount > bounds.maxItems) errors.push({ questionId: question.id, code: "max-items" });
  }
  return errors;
}

function cloneJsonValue(value, seen = new Set(), depth = 0) {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (depth > 16 || typeof value !== "object" || seen.has(value)) return undefined;
  seen.add(value);
  if (Array.isArray(value)) {
    const items = value.map((item) => cloneJsonValue(item, seen, depth + 1));
    seen.delete(value);
    return items.some((item) => item === undefined) ? undefined : items;
  }
  if (!isPlainRecord(value)) { seen.delete(value); return undefined; }
  const copy = {};
  for (const [key, item] of Object.entries(value)) {
    const cloned = cloneJsonValue(item, seen, depth + 1);
    if (cloned === undefined) { seen.delete(value); return undefined; }
    Object.defineProperty(copy, key, { value: cloned, enumerable: true, configurable: true, writable: true });
  }
  seen.delete(value);
  return copy;
}

/** Build an ephemeral preview config from visible draft answers without persisting or sending them. */
export function mapVisibleQuestionnaireDraft(schema, answers = {}) {
  if (!Array.isArray(schema?.questions) || !isPlainRecord(answers)) return {};
  const progress = getQuestionnaireProgress(schema, answers);
  const values = {};
  for (const questionId of progress.visibleQuestionIds) {
    const question = schema.questions.find((item) => item.id === questionId);
    const targetKey = question?.answerMapping?.targetKey;
    if (!question || typeof targetKey !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(targetKey) || !Object.hasOwn(answers, questionId) || isEmpty(answers[questionId])) continue;
    const copied = cloneJsonValue(answers[questionId]);
    if (copied !== undefined) values[targetKey] = copied;
  }
  return values;
}

/** Validate a completed questionnaire and create its declarative site configuration values. */
export function mapQuestionnaireAnswers(schema, answers) {
  const errors = validateQuestionnaireAnswers(schema, answers);
  const targets = new Set();
  const questions = Array.isArray(schema?.questions) ? schema.questions : [];
  for (const question of questions) {
    if (question?.answerMapping === undefined) continue;
    const targetKey = question.answerMapping?.targetKey;
    if (typeof targetKey !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(targetKey)) errors.push({ questionId: question.id ?? null, code: "invalid-answer-mapping" });
    else if (targets.has(targetKey)) errors.push({ questionId: question.id, code: "duplicate-answer-mapping" });
    else targets.add(targetKey);
  }
  if (errors.length) return { ok: false, errors };
  return { ok: true, values: mapVisibleQuestionnaireDraft(schema, answers) };
}

/** Compute active cards and honest progress for a validated questionnaire schema. */
export function getQuestionnaireProgress(schema, answers = {}) {
  if (!isPlainRecord(answers) || !Array.isArray(schema?.questions) || schema.questions.some((question) => !question || typeof question.id !== "string") || new Set(schema.questions.map((question) => question.id)).size !== schema.questions.length) return { visibleQuestionIds: [], currentQuestionId: null, answeredCount: 0, total: 0 };
  const byId = new Map(schema.questions.map((question) => [question.id, question]));
  const cache = new Map();
  const active = schema.questions.filter((question) => visible(question, byId, answers, cache));
  const answered = (question) => isAnswered(answers[question.id]);
  return {
    visibleQuestionIds: active.map((question) => question.id),
    currentQuestionId: active.find((question) => !answered(question))?.id ?? null,
    answeredCount: active.filter(answered).length,
    total: active.length,
  };
}

/** Reconcile a changed answer and remove values for branches that are no longer visible. */
export function reconcileQuestionnaireAnswers(schema, currentAnswers = {}, changedQuestionId, nextValue) {
  if (!Array.isArray(schema?.questions) || !schema.questions.some((question) => question.id === changedQuestionId)) {
    return { answers: { ...currentAnswers }, visibleQuestionIds: [], currentQuestionId: null, answeredCount: 0, total: 0, error: "Unknown questionnaire question." };
  }
  const answers = { ...currentAnswers, [changedQuestionId]: nextValue };
  const progress = getQuestionnaireProgress(schema, answers);
  const visibleIds = new Set(progress.visibleQuestionIds);
  for (const questionId of Object.keys(answers)) if (!visibleIds.has(questionId)) delete answers[questionId];
  return { ...progress, answers, error: null };
}
