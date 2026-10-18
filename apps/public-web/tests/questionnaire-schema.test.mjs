import assert from "node:assert/strict";
import test from "node:test";
import { countDiscardedAnsweredQuestions, getQuestionnaireProgress, mapQuestionnaireAnswers, mapVisibleQuestionnaireDraft, reconcileQuestionnaireAnswers, validateQuestionnaireAnswers } from "../features/questionnaire/engine.mjs";
import { validateQuestionnaireSchema as validateSchema } from "../features/questionnaire/schema.mjs";

function schema() {
  return {
    schemaId: "registration-onboarding", schemaVersion: "1.0.0", locale: "fr-HT",
    questions: [
      { id: "business-type", version: "1.0.0", type: "singleChoice", label: "Type d’activité", required: true, options: [{ id: "school", label: "École" }, { id: "shop", label: "Boutique" }], answerMapping: { targetKey: "site-type" } },
      { id: "collect-payment", version: "1.0.0", type: "yesNo", label: "Encaisser en ligne", required: true, visibilityRules: [{ questionId: "business-type", operator: "answered" }], answerMapping: { targetKey: "collect-payment" } },
      { id: "payment-method", version: "1.0.0", type: "multipleChoice", label: "Parcours de paiement client", required: true, options: [{ id: "order", label: "Commande" }], visibilityRules: [{ questionId: "collect-payment", operator: "equals", value: true }], answerMapping: { targetKey: "customer-payment-uses" } },
      { id: "school-level", version: "1.0.0", type: "shortText", label: "Niveau scolaire", required: false, visibilityRules: [{ questionId: "business-type", operator: "equals", value: "school" }], requiredWhen: [{ questionId: "business-type", operator: "equals", value: "school" }], answerMapping: { targetKey: "school-level" } },
      { id: "included-sections", version: "1.0.0", type: "multipleChoice", label: "Sections", required: false, options: [{ id: "overview", label: "Présentation" }, { id: "contact", label: "Contact" }], answerMapping: { targetKey: "included-sections" } },
    ],
  };
}

test("accepts a versioned declarative schema with earlier-question conditions", () => {
  assert.deepEqual(validateSchema(schema()), []);
});

test("blank composite answers do not count as answered or reveal dependent questions", () => {
  const current = { questions: [
    { id: "amount", type: "amount", required: false },
    { id: "amount-details", type: "shortText", required: false, visibilityRules: [{ questionId: "amount", operator: "answered" }] },
  ] };
  assert.deepEqual(getQuestionnaireProgress(current, { amount: { value: "", currency: "HTG" } }), {
    visibleQuestionIds: ["amount"], currentQuestionId: "amount", answeredCount: 0, total: 1,
  });
  assert.deepEqual(getQuestionnaireProgress(current, { amount: { value: "125", currency: "HTG" } }), {
    visibleQuestionIds: ["amount", "amount-details"], currentQuestionId: "amount-details", answeredCount: 1, total: 2,
  });
});

test("maps a completed questionnaire to visible site configuration values", () => {
  assert.deepEqual(mapQuestionnaireAnswers(schema(), { "business-type": "shop", "collect-payment": false }), {
    ok: true,
    values: { "site-type": "shop", "collect-payment": false },
  });
  assert.deepEqual(mapQuestionnaireAnswers(schema(), { "business-type": "shop" }), {
    ok: false,
    errors: [{ questionId: "collect-payment", code: "required" }],
  });
});

test("preview mapping includes visible incomplete draft answers and prunes hidden branches", () => {
  assert.deepEqual(mapVisibleQuestionnaireDraft(schema(), {
    "business-type": "shop",
    "collect-payment": false,
    "school-level": "stale hidden answer",
  }), { "site-type": "shop", "collect-payment": false });
});

test("maps optional section choices into preview configuration", () => {
  assert.deepEqual(mapVisibleQuestionnaireDraft(schema(), {
    "business-type": "shop",
    "included-sections": ["overview", "contact"],
  }), {
    "site-type": "shop",
    "included-sections": ["overview", "contact"],
  });
});

test("customer payment questions stay hidden unless the owner enables them", () => {
  assert.deepEqual(mapQuestionnaireAnswers(schema(), { "business-type": "shop", "collect-payment": false }), {
    ok: true,
    values: { "site-type": "shop", "collect-payment": false },
  });
  assert.deepEqual(mapQuestionnaireAnswers(schema(), {
    "business-type": "shop", "collect-payment": true, "payment-method": ["order"],
  }), {
    ok: true,
    values: { "site-type": "shop", "collect-payment": true, "customer-payment-uses": ["order"] },
  });
  assert.deepEqual(validateQuestionnaireAnswers(schema(), {
    "business-type": "shop", "collect-payment": false, "payment-method": ["order"],
  }), [{ questionId: "payment-method", code: "inapplicable-answer" }]);
});

test("declares all questionnaire field kinds from the product contract", () => {
  const current = schema();
  const kinds = ["shortText", "longText", "email", "phone", "number", "amount", "singleChoice", "multipleChoice", "yesNo", "date", "dateTime", "file", "image", "logo", "color", "font", "address", "geographicArea", "repeatableList", "order", "sectionChoice"];
  current.questions = kinds.map((type, index) => ({
    id: `question-${index}`, version: "1.0.0", type, label: `Question ${index}`, required: false,
    ...(["singleChoice", "multipleChoice", "font", "geographicArea", "order", "sectionChoice"].includes(type) ? { options: [{ id: "choice-one", label: "Choice one" }] } : {}),
  }));
  assert.deepEqual(validateSchema(current), []);
});

test("rejects executable keys, forward references, unsupported operators and duplicate IDs", () => {
  const invalid = schema();
  invalid.questions[0].compute = "return process.env";
  invalid.questions[1].id = "business-type";
  invalid.questions[1].visibilityRules = [{ questionId: "school-level", operator: "eval", value: "x" }];
  const errors = validateSchema(invalid);
  assert.ok(errors.some((error) => error.includes("compute is not supported")));
  assert.ok(errors.some((error) => error.includes("id is duplicated")));
  assert.ok(errors.some((error) => error.includes("must reference an earlier question")));
});

test("rejects invalid versions, duplicate options and contradictory validation bounds", () => {
  const invalid = schema();
  invalid.questions[0].version = "latest";
  invalid.questions[0].options.push({ id: "school", label: "Autre" });
  invalid.questions[3].validation = { minLength: 10, maxLength: 2, pattern: ".*" };
  const errors = validateSchema(invalid);
  assert.ok(errors.some((error) => error.includes("semantic version")));
  assert.ok(errors.some((error) => error.includes("options[2].id is duplicated")));
  assert.ok(errors.some((error) => error.includes("pattern is not supported")));
  assert.ok(errors.some((error) => error.includes("minLength must not exceed maxLength")));
});

test("malformed option sources produce errors rather than throwing", () => {
  const invalid = schema();
  invalid.questions[0].options = "not-an-array";
  invalid.questions[3].visibilityRules = [{ questionId: "business-type", operator: "equals", value: "school" }];
  assert.doesNotThrow(() => validateSchema(invalid));
  assert.ok(validateSchema(invalid).length > 0);
});

test("calculates branch-specific progress and keeps unpaid business-payment questions out when disabled", () => {
  const current = schema();
  assert.deepEqual(getQuestionnaireProgress(current, { "business-type": "school", "collect-payment": false }), {
    visibleQuestionIds: ["business-type", "collect-payment", "school-level", "included-sections"], currentQuestionId: "school-level", answeredCount: 2, total: 4,
  });
  assert.deepEqual(getQuestionnaireProgress(current, { "business-type": "shop", "collect-payment": true }), {
    visibleQuestionIds: ["business-type", "collect-payment", "payment-method", "included-sections"], currentQuestionId: "payment-method", answeredCount: 2, total: 4,
  });
});

test("does not expose descendants when an earlier conditional parent is hidden", () => {
  const current = schema();
  const result = getQuestionnaireProgress(current, { "school-level": "stale answer" });
  assert.deepEqual(result.visibleQuestionIds, ["business-type", "included-sections"]);
});

test("notEquals conditions remain hidden until their source question is answered", () => {
  const current = schema();
  current.questions.push({ id: "no-payment-note", version: "1.0.0", type: "shortText", label: "No payment", required: false, visibilityRules: [{ questionId: "collect-payment", operator: "notEquals", value: true }] });
  assert.ok(!getQuestionnaireProgress(current, { "business-type": "shop" }).visibleQuestionIds.includes("no-payment-note"));
  assert.ok(getQuestionnaireProgress(current, { "business-type": "shop", "collect-payment": false }).visibleQuestionIds.includes("no-payment-note"));
});

test("contains conditions inspect selected IDs in a multiple-choice answer", () => {
  const current = schema();
  current.questions.push({ id: "moncash-details", version: "1.0.0", type: "shortText", label: "Details", required: false, visibilityRules: [{ questionId: "payment-method", operator: "contains", value: "moncash" }] });
  assert.ok(getQuestionnaireProgress(current, { "business-type": "shop", "collect-payment": true, "payment-method": ["moncash"] }).visibleQuestionIds.includes("moncash-details"));
  assert.ok(!getQuestionnaireProgress(current, { "business-type": "shop", "collect-payment": true, "payment-method": [] }).visibleQuestionIds.includes("moncash-details"));
});

test("invalid cyclic schemas do not recurse indefinitely in the evaluator", () => {
  const current = schema();
  current.questions[0].visibilityRules = [{ questionId: "school-level", operator: "answered" }];
  current.questions[3].visibilityRules = [{ questionId: "business-type", operator: "equals", value: "school" }];
  assert.doesNotThrow(() => getQuestionnaireProgress(current, {}));
});

test("removes obsolete answers when a parent selection changes and retains active answers", () => {
  const result = reconcileQuestionnaireAnswers(schema(), { "business-type": "school", "collect-payment": true, "payment-method": ["moncash"], "school-level": "Secondaire" }, "business-type", "shop");
  assert.deepEqual(result.answers, { "business-type": "shop", "collect-payment": true, "payment-method": ["moncash"] });
  assert.deepEqual(result.visibleQuestionIds, ["business-type", "collect-payment", "payment-method", "included-sections"]);
});

test("counts meaningful branch answers for a reversible loss warning", () => {
  const previous = { "business-type": "school", "collect-payment": true, "school-level": "Secondaire", "included-sections": [] };
  const next = reconcileQuestionnaireAnswers(schema(), previous, "business-type", "shop").answers;
  assert.equal(countDiscardedAnsweredQuestions(schema(), previous, next), 1);
  assert.equal(countDiscardedAnsweredQuestions(schema(), { ...previous, "school-level": "  " }, next), 0);
  assert.equal(countDiscardedAnsweredQuestions(schema(), { ...previous, "obsolete-answer": "ancienne réponse" }, next), 2);
});

test("unknown answer changes preserve the source map and return an error", () => {
  const answers = { "business-type": "school" };
  const result = reconcileQuestionnaireAnswers(schema(), answers, "missing", "shop");
  assert.deepEqual(result.answers, answers);
  assert.equal(result.error, "Unknown questionnaire question.");
});

test("requires visible required answers while accepting false as an answered yes/no value", () => {
  assert.deepEqual(validateQuestionnaireAnswers(schema(), { "business-type": "shop", "collect-payment": false }), []);
  assert.deepEqual(validateQuestionnaireAnswers(schema(), { "business-type": "shop" }), [{ questionId: "collect-payment", code: "required" }]);
});

test("applies conditional required rules only when their condition is active", () => {
  assert.deepEqual(validateQuestionnaireAnswers(schema(), { "business-type": "shop", "collect-payment": false }), []);
  assert.deepEqual(validateQuestionnaireAnswers(schema(), { "business-type": "school", "collect-payment": false }), [{ questionId: "school-level", code: "required" }]);
});

test("checks text, email, phone, numeric and choice answer types", () => {
  const current = schema();
  const errors = validateQuestionnaireAnswers(current, { "business-type": ["school"], "collect-payment": "false", "school-level": "  " });
  assert.deepEqual(errors, [
    { questionId: "school-level", code: "inapplicable-answer" },
    { questionId: "business-type", code: "invalid-type" },
    { questionId: "collect-payment", code: "invalid-type" },
  ]);
  const contact = { questions: [
    { id: "email", type: "email", required: true }, { id: "phone", type: "phone", required: false },
    { id: "count", type: "number", required: true, validation: { min: 1, max: 4 } },
  ] };
  assert.deepEqual(validateQuestionnaireAnswers(contact, { email: "bad", phone: "abc", count: 5 }), [
    { questionId: "email", code: "invalid-type" }, { questionId: "phone", code: "invalid-type" }, { questionId: "count", code: "max-value" },
  ]);
});

test("validates strict calendar dates and timezone-qualified date-time values", () => {
  const current = { questions: [
    { id: "date", type: "date", required: true }, { id: "meeting", type: "dateTime", required: true },
  ] };
  assert.deepEqual(validateQuestionnaireAnswers(current, { date: "2026-02-31", meeting: "2026-10-11T09:00:00" }), [
    { questionId: "date", code: "invalid-type" }, { questionId: "meeting", code: "invalid-type" },
  ]);
  assert.deepEqual(validateQuestionnaireAnswers(current, { date: "2026-02-28", meeting: "2026-10-11T09:00:00-04:00" }), []);
});

test("validates amount shape without pretending to know currency-specific bounds", () => {
  const current = { questions: [{ id: "price", type: "amount", required: true }] };
  assert.deepEqual(validateQuestionnaireAnswers(current, { price: { value: "0.50", currency: "HTG" } }), []);
  assert.deepEqual(validateQuestionnaireAnswers(current, { price: { value: "10.25", currency: "HTG", settled: true } }), [{ questionId: "price", code: "invalid-type" }]);
  assert.deepEqual(validateQuestionnaireAnswers(current, { price: { value: "10.25", currency: "HTG" } }), []);
});

test("requires amount bounds to be checked by server-side currency policy", () => {
  const current = schema();
  current.questions.push({ id: "amount", version: "1.0.0", type: "amount", label: "Amount", required: true, validation: { min: 1 } });
  assert.ok(validateSchema(current).some((error) => error.includes("currency-specific amount bounds belong to the server")));
});

test("validates unique multiple choices and complete item ordering", () => {
  const current = { questions: [
    { id: "sectors", type: "multipleChoice", required: true, options: [{ id: "school" }, { id: "shop" }], validation: { minItems: 1, maxItems: 2 } },
    { id: "sections", type: "order", required: true, options: [{ id: "hero" }, { id: "contact" }] },
  ] };
  assert.deepEqual(validateQuestionnaireAnswers(current, { sectors: ["school", "school"], sections: ["hero"] }), [
    { questionId: "sectors", code: "invalid-type" }, { questionId: "sections", code: "invalid-type" },
  ]);
  assert.deepEqual(validateQuestionnaireAnswers(current, { sectors: ["school"], sections: ["contact", "hero"] }), []);
});

test("enforces minimum item bounds on an explicitly empty optional list", () => {
  const current = { questions: [{ id: "tags", type: "multipleChoice", required: false, options: [{ id: "one" }], validation: { minItems: 1 } }] };
  assert.deepEqual(validateQuestionnaireAnswers(current, { tags: [] }), [{ questionId: "tags", code: "min-items" }]);
});

test("validates color, address and repeatable-list value shapes", () => {
  const current = { questions: [
    { id: "brand-color", type: "color", required: true },
    { id: "address", type: "address", required: true },
    { id: "programs", type: "repeatableList", required: true, validation: { minItems: 1 } },
  ] };
  assert.deepEqual(validateQuestionnaireAnswers(current, {
    "brand-color": "not-a-color", address: { city: "" }, programs: [{}],
  }), [
    { questionId: "brand-color", code: "invalid-type" },
    { questionId: "address", code: "invalid-type" },
    { questionId: "programs", code: "invalid-type" },
  ]);
  assert.deepEqual(validateQuestionnaireAnswers(current, {
    "brand-color": "#1a2b3c", address: { city: "Port-au-Prince", countryCode: "HT" }, programs: [{ name: "Program A" }],
  }), []);
  assert.deepEqual(validateQuestionnaireAnswers(current, {
    "brand-color": "#1a2b3c", address: { city: "Port-au-Prince", countryCode: "HT" }, programs: [{ name: "   " }],
  }), [{ questionId: "programs", code: "invalid-type" }]);
});

test("geographic-area answers must reference configured area options", () => {
  const current = { questions: [{ id: "service-area", type: "geographicArea", required: true, options: [{ id: "west", label: "Ouest" }] }] };
  assert.deepEqual(validateQuestionnaireAnswers(current, { "service-area": "north" }), [{ questionId: "service-area", code: "invalid-type" }]);
  assert.deepEqual(validateQuestionnaireAnswers(current, { "service-area": "west" }), []);
});

test("never treats a selected file/image/logo as validated on the client", () => {
  const current = { questions: [{ id: "logo", type: "logo", required: false }] };
  assert.deepEqual(validateQuestionnaireAnswers(current, { logo: { name: "logo.png", type: "image/png" } }), [{ questionId: "logo", code: "server-file-validation-required" }]);
});

test("rejects unknown answer IDs and answers that remain on hidden branches", () => {
  assert.deepEqual(validateQuestionnaireAnswers(schema(), { "business-type": "shop", "collect-payment": false, "school-level": "stale", extra: "value" }), [
    { questionId: "school-level", code: "inapplicable-answer" }, { questionId: "extra", code: "unknown-question" },
  ]);
});
