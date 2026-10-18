import assert from "node:assert/strict";
import test from "node:test";
import { getQuestionnaireProgress, reconcileQuestionnaireAnswers, validateQuestionnaireAnswers } from "../features/registration/questionnaire-engine.mjs";

function config() {
  return { application: { fields: [
    { id: "program-choice", type: "select", label: "Program", required: true, options: [{ id: "one", label: "One" }, { id: "two", label: "Two" }] },
    { id: "document", type: "file", label: "Document", required: true, showWhen: { fieldId: "program-choice", optionId: "one" } },
    { id: "email", type: "email", label: "Email", required: true },
  ] } };
}

test("progress exposes one next unanswered visible card and honest branch total", () => {
  assert.deepEqual(getQuestionnaireProgress(config(), { "program-choice": "one" }), { visibleFieldIds: ["program-choice", "document", "email"], currentQuestionId: "document", answeredCount: 1, total: 3 });
  assert.deepEqual(getQuestionnaireProgress(config(), { "program-choice": "two" }), { visibleFieldIds: ["program-choice", "email"], currentQuestionId: "email", answeredCount: 1, total: 2 });
});

test("changing a parent selection removes answers from a hidden branch", () => {
  const result = reconcileQuestionnaireAnswers(config(), { "program-choice": "one", document: { name: "record.pdf" }, email: "a@example.invalid" }, "program-choice", "two");
  assert.deepEqual(result.answers, { "program-choice": "two", email: "a@example.invalid" });
  assert.deepEqual(result.visibleFieldIds, ["program-choice", "email"]);
  assert.equal(result.currentQuestionId, null);
});

test("unknown field changes preserve the answer map and return an explicit error", () => {
  const current = { "program-choice": "one" };
  const result = reconcileQuestionnaireAnswers(config(), current, "missing", "two");
  assert.deepEqual(result.answers, current);
  assert.equal(result.error, "Unknown questionnaire field.");
});

test("an empty answer remains the current question", () => {
  const result = reconcileQuestionnaireAnswers(config(), {}, "program-choice", "");
  assert.equal(result.currentQuestionId, "program-choice");
});

test("validates only visible answers and rejects invalid required values/options", () => {
  assert.deepEqual(validateQuestionnaireAnswers(config(), { "program-choice": "two", email: "not-email" }), [{ fieldId: "email", code: "invalid-email" }]);
  assert.deepEqual(validateQuestionnaireAnswers(config(), { "program-choice": "unknown", email: "a@example.invalid" }), [{ fieldId: "program-choice", code: "invalid-option" }]);
});

test("rejects impossible calendar dates instead of normalizing them", () => {
  const dateConfig = { application: { fields: [{ id: "start", type: "date", label: "Start", required: true }] } };
  assert.deepEqual(validateQuestionnaireAnswers(dateConfig, { start: "2026-02-31" }), [{ fieldId: "start", code: "invalid-date" }]);
});

test("a required checkbox must be affirmatively checked", () => {
  const consentConfig = { application: { fields: [{ id: "terms", type: "checkbox", label: "Terms", required: true }] } };
  assert.deepEqual(validateQuestionnaireAnswers(consentConfig, { terms: false }), [{ fieldId: "terms", code: "required" }]);
  assert.deepEqual(validateQuestionnaireAnswers(consentConfig, { terms: true }), []);
});

test("file answers are never treated as validated by client-only checks", () => {
  assert.deepEqual(validateQuestionnaireAnswers(config(), { "program-choice": "one", document: { name: "record.pdf" }, email: "a@example.invalid" }), [{ fieldId: "document", code: "file-validation-requires-server" }]);
});
