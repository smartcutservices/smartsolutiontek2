const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const versionPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const types = new Set(["shortText", "longText", "email", "phone", "number", "amount", "singleChoice", "multipleChoice", "yesNo", "date", "dateTime", "file", "image", "logo", "color", "font", "address", "geographicArea", "repeatableList", "order", "sectionChoice"]);
const optionTypes = new Set(["singleChoice", "multipleChoice", "font", "geographicArea", "order", "sectionChoice"]);
const isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
const isStableId = (value) => typeof value === "string" && idPattern.test(value);

function onlyKeys(value, allowed, path, errors) {
  for (const key of Object.keys(value)) if (!allowed.includes(key)) errors.push(`${path}.${key} is not supported.`);
}

/** Validate a versioned declarative wizard schema; no supplied code is evaluated. */
export function validateQuestionnaireSchema(schema) {
  const errors = [];
  if (!isRecord(schema)) return ["Questionnaire schema must be an object."];
  onlyKeys(schema, ["schemaId", "schemaVersion", "locale", "questions"], "schema", errors);
  if (!isStableId(schema.schemaId)) errors.push("schema.schemaId must be a stable lowercase ID.");
  if (typeof schema.schemaVersion !== "string" || !versionPattern.test(schema.schemaVersion)) errors.push("schema.schemaVersion must use semantic version syntax.");
  if (typeof schema.locale !== "string" || !/^[a-z]{2}(?:-[A-Z]{2})?$/.test(schema.locale)) errors.push("schema.locale must be a language tag such as fr or fr-HT.");
  if (!Array.isArray(schema.questions) || schema.questions.length === 0) return [...errors, "schema.questions must contain at least one question."];

  const earlier = new Map();
  const questionIds = new Set();
  for (const [index, question] of schema.questions.entries()) {
    const path = `questions[${index}]`;
    if (!isRecord(question)) { errors.push(`${path} must be an object.`); continue; }
    onlyKeys(question, ["id", "version", "type", "label", "help", "required", "requiredWhen", "default", "validation", "visibilityRules", "dependencies", "answerMapping", "analyticsTag", "permissions", "options"], path, errors);
    if (!isStableId(question.id)) errors.push(`${path}.id must be a stable lowercase ID.`);
    else if (questionIds.has(question.id)) errors.push(`${path}.id is duplicated.`);
    if (isStableId(question.id)) questionIds.add(question.id);
    if (isStableId(question.id)) earlier.set(question.id, { question, index });
    if (typeof question.version !== "string" || !versionPattern.test(question.version)) errors.push(`${path}.version must use semantic version syntax.`);
    if (!types.has(question.type)) errors.push(`${path}.type is unsupported.`);
    if (typeof question.label !== "string" || !question.label.trim()) errors.push(`${path}.label is required.`);
    if (question.help !== undefined && (typeof question.help !== "string" || !question.help.trim())) errors.push(`${path}.help must be non-empty when present.`);
    if (typeof question.required !== "boolean") errors.push(`${path}.required must be boolean.`);

    if (optionTypes.has(question.type)) {
      if (!Array.isArray(question.options) || question.options.length === 0) errors.push(`${path}.options are required for ${question.type}.`);
      else {
        const optionIds = new Set();
        for (const [optionIndex, option] of question.options.entries()) {
          const optionPath = `${path}.options[${optionIndex}]`;
          if (!isRecord(option)) { errors.push(`${optionPath} must be an object.`); continue; }
          onlyKeys(option, ["id", "label"], optionPath, errors);
          if (!isStableId(option.id)) errors.push(`${optionPath}.id must be a stable lowercase ID.`);
          else if (optionIds.has(option.id)) errors.push(`${optionPath}.id is duplicated.`);
          else optionIds.add(option.id);
          if (typeof option.label !== "string" || !option.label.trim()) errors.push(`${optionPath}.label is required.`);
        }
      }
    } else if (question.options !== undefined) errors.push(`${path}.options are not supported for this question type.`);

    if (question.validation !== undefined) {
      if (!isRecord(question.validation)) errors.push(`${path}.validation must be an object.`);
      else {
        onlyKeys(question.validation, ["minLength", "maxLength", "min", "max", "minItems", "maxItems"], `${path}.validation`, errors);
        for (const key of ["minLength", "maxLength", "minItems", "maxItems"]) if (question.validation[key] !== undefined && (!Number.isSafeInteger(question.validation[key]) || question.validation[key] < 0)) errors.push(`${path}.validation.${key} must be a non-negative integer.`);
        for (const key of ["min", "max"]) if (question.validation[key] !== undefined && (typeof question.validation[key] !== "number" || !Number.isFinite(question.validation[key]))) errors.push(`${path}.validation.${key} must be finite.`);
        if (question.validation.min > question.validation.max && question.validation.min !== undefined && question.validation.max !== undefined) errors.push(`${path}.validation.min must not exceed max.`);
        if (question.validation.minLength > question.validation.maxLength && question.validation.minLength !== undefined && question.validation.maxLength !== undefined) errors.push(`${path}.validation.minLength must not exceed maxLength.`);
        if (question.validation.minItems > question.validation.maxItems && question.validation.minItems !== undefined && question.validation.maxItems !== undefined) errors.push(`${path}.validation.minItems must not exceed maxItems.`);
        if ((question.validation.minLength !== undefined || question.validation.maxLength !== undefined) && !["shortText", "longText", "email", "phone"].includes(question.type)) errors.push(`${path}.validation length limits require a text question.`);
        if ((question.validation.min !== undefined || question.validation.max !== undefined) && question.type !== "number") errors.push(`${path}.validation numeric limits require a number question; currency-specific amount bounds belong to the server.`);
        if ((question.validation.minItems !== undefined || question.validation.maxItems !== undefined) && !["multipleChoice", "repeatableList", "order"].includes(question.type)) errors.push(`${path}.validation item limits require a list question.`);
      }
    }

    for (const rulesKey of ["visibilityRules", "requiredWhen"]) {
      const rules = question[rulesKey];
      if (rules === undefined) continue;
      if (!Array.isArray(rules)) errors.push(`${path}.${rulesKey} must be an array.`);
      else for (const [ruleIndex, rule] of rules.entries()) {
        const rulePath = `${path}.${rulesKey}[${ruleIndex}]`;
        if (!isRecord(rule)) { errors.push(`${rulePath} must be an object.`); continue; }
        onlyKeys(rule, ["questionId", "operator", "value"], rulePath, errors);
        const source = earlier.get(rule.questionId);
        if (!source || source.index >= index) { errors.push(`${rulePath}.questionId must reference an earlier question.`); continue; }
        if (rule.operator === "answered") {
          if (Object.hasOwn(rule, "value")) errors.push(`${rulePath}.value is not used by answered.`);
        } else if (!["equals", "notEquals", "contains"].includes(rule.operator)) errors.push(`${rulePath}.operator is unsupported.`);
        else if (!Object.hasOwn(rule, "value") || !["string", "number", "boolean"].includes(typeof rule.value)) errors.push(`${rulePath}.value must be a string, number or boolean.`);
        else if (rule.operator === "contains" && source.question.type !== "multipleChoice") errors.push(`${rulePath}.contains requires a multipleChoice source.`);
        else if (rule.operator === "contains" && (!Array.isArray(source.question.options) || !source.question.options.some((option) => option?.id === rule.value))) errors.push(`${rulePath}.value must match an option on the source question.`);
        else if (["equals", "notEquals"].includes(rule.operator) && !["shortText", "longText", "email", "phone", "number", "singleChoice", "yesNo", "date", "dateTime", "color", "font", "geographicArea", "sectionChoice"].includes(source.question.type)) errors.push(`${rulePath}.${rule.operator} requires a comparable scalar source.`);
        else if (["number", "amount"].includes(source.question.type) && typeof rule.value !== "number") errors.push(`${rulePath}.value must be numeric for this source.`);
        else if (source.question.type === "yesNo" && typeof rule.value !== "boolean") errors.push(`${rulePath}.value must be boolean for yesNo.`);
        else if (["singleChoice", "font", "geographicArea", "sectionChoice"].includes(source.question.type) && typeof rule.value !== "string") errors.push(`${rulePath}.value must be a string option ID.`);
        else if (["singleChoice", "font", "geographicArea", "sectionChoice"].includes(source.question.type) && (!Array.isArray(source.question.options) || !source.question.options.some((option) => option?.id === rule.value))) errors.push(`${rulePath}.value must match an option on the source question.`);
        else if (["shortText", "longText", "email", "phone", "date", "dateTime", "color"].includes(source.question.type) && typeof rule.value !== "string") errors.push(`${rulePath}.value must be a string for this source.`);
      }
    }

    if (question.dependencies !== undefined) {
      if (!Array.isArray(question.dependencies)) errors.push(`${path}.dependencies must be an array.`);
      else {
        const ids = new Set();
        for (const dependencyId of question.dependencies) {
          if (!earlier.has(dependencyId)) errors.push(`${path}.dependencies may reference only earlier question IDs.`);
          if (ids.has(dependencyId)) errors.push(`${path}.dependencies must not contain duplicates.`);
          ids.add(dependencyId);
        }
      }
    }
    if (question.answerMapping !== undefined && (!isRecord(question.answerMapping) || Object.keys(question.answerMapping).some((key) => key !== "targetKey") || !isStableId(question.answerMapping.targetKey))) errors.push(`${path}.answerMapping must contain only a stable targetKey.`);
    if (question.analyticsTag !== undefined && !isStableId(question.analyticsTag)) errors.push(`${path}.analyticsTag must be a stable lowercase ID.`);
    if (question.permissions !== undefined && (!Array.isArray(question.permissions) || question.permissions.some((permission) => !isStableId(permission)) || new Set(question.permissions).size !== question.permissions.length)) errors.push(`${path}.permissions must contain unique stable IDs.`);
  }
  return errors;
}
