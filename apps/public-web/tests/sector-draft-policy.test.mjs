import assert from "node:assert/strict";
import test from "node:test";
import {
  createSectorDraftRecord,
  hasConcurrentSectorDraftEdit,
  isQuestionnaireAnswerRecord,
  sanitizeSectorDraftAnswers,
  supportsSectorDraftMigration,
} from "../features/sectors/draft-policy.mjs";

const schema = {
  schemaId: "sector-demo",
  schemaVersion: "1.4.0",
  locale: "fr-HT",
  questions: [
    { id: "goal", version: "1.0.0", type: "singleChoice", label: "Goal", required: true, options: [{ id: "simple", label: "Simple" }, { id: "details", label: "Details" }] },
    { id: "details", version: "1.0.0", type: "longText", label: "Details", required: true, visibilityRules: [{ questionId: "goal", operator: "equals", value: "details" }], dependencies: ["goal"] },
    { id: "style", version: "1.0.0", type: "singleChoice", label: "Style", required: true, options: [{ id: "warm", label: "Warm" }] },
    { id: "email", version: "1.0.0", type: "email", label: "Email", required: true },
    { id: "quantity", version: "1.0.0", type: "number", label: "Quantity", required: false },
    { id: "budget", version: "1.0.0", type: "amount", label: "Budget", required: false },
    { id: "features", version: "1.0.0", type: "multipleChoice", label: "Features", required: false, options: [{ id: "booking", label: "Booking" }, { id: "catalog", label: "Catalog" }] },
    { id: "address", version: "1.0.0", type: "address", label: "Address", required: false },
    { id: "items", version: "1.0.0", type: "repeatableList", label: "Items", required: false },
    { id: "priority", version: "1.0.0", type: "order", label: "Priority", required: false, options: [{ id: "first", label: "First" }, { id: "second", label: "Second" }] },
    { id: "logo", version: "1.0.0", type: "logo", label: "Logo", required: false },
    { id: "included-sections", version: "1.0.0", type: "multipleChoice", label: "Sections", required: false, options: [{ id: "overview", label: "Overview" }, { id: "contact", label: "Contact" }] },
    { id: "accept-customer-payments", version: "1.0.0", type: "yesNo", label: "Accept client payments", required: true },
    { id: "customer-payment-uses", version: "1.0.0", type: "multipleChoice", label: "Payment uses", required: true, options: [{ id: "order", label: "Order" }, { id: "booking", label: "Booking" }], visibilityRules: [{ questionId: "accept-customer-payments", operator: "equals", value: true }] },
  ],
};

test("draft sanitizer prunes hidden and unknown answers but preserves incomplete text", () => {
  const result = sanitizeSectorDraftAnswers(schema, {
    goal: "simple",
    details: "no longer applicable",
    style: "removed-option",
    email: "still-typing@",
    removedQuestion: "old answer",
  });
  assert.deepEqual(result, { answers: { goal: "simple", email: "still-typing@" }, changed: true });
});

test("draft sanitizer retains answers in the selected conditional branch", () => {
  const answers = { goal: "details", details: "Keep this branch", email: "team@example.test" };
  assert.deepEqual(sanitizeSectorDraftAnswers(schema, answers), { answers, changed: false });
});

test("draft sanitizer preserves the additive section-selection answer", () => {
  const answers = { goal: "simple", "included-sections": ["overview", "contact"] };
  assert.deepEqual(sanitizeSectorDraftAnswers(schema, answers), { answers, changed: false });
});

test("the additive 1.6 schema keeps compatible payment-use answers from 1.4", () => {
  const nextSchema = { ...schema, schemaVersion: "1.6.0" };
  const ticketingSchema = { ...schema, schemaVersion: "1.7.0" };
  const realEstateSchema = { ...schema, schemaVersion: "1.8.0" };
  const hospitalitySchema = { ...schema, schemaVersion: "1.9.0" };
  const tourismSchema = { ...schema, schemaVersion: "1.10.0" };
  const vehiclesSchema = { ...schema, schemaVersion: "1.11.0" };
  const answers = { goal: "simple", "accept-customer-payments": true, "customer-payment-uses": ["order"] };
  assert.equal(supportsSectorDraftMigration("1.4.0", nextSchema.schemaVersion), true);
  assert.equal(supportsSectorDraftMigration("1.6.0", ticketingSchema.schemaVersion), true);
  assert.equal(supportsSectorDraftMigration("1.7.0", realEstateSchema.schemaVersion), true);
  assert.equal(supportsSectorDraftMigration(realEstateSchema.schemaVersion, hospitalitySchema.schemaVersion), true);
  assert.equal(supportsSectorDraftMigration("1.6.0", hospitalitySchema.schemaVersion), true);
  assert.equal(supportsSectorDraftMigration(hospitalitySchema.schemaVersion, tourismSchema.schemaVersion), true);
  assert.equal(supportsSectorDraftMigration("1.6.0", tourismSchema.schemaVersion), true);
  assert.equal(supportsSectorDraftMigration(tourismSchema.schemaVersion, vehiclesSchema.schemaVersion), true);
  assert.equal(supportsSectorDraftMigration("1.6.0", vehiclesSchema.schemaVersion), true);
  assert.deepEqual(sanitizeSectorDraftAnswers(nextSchema, answers), { answers, changed: false });
});

test("draft sanitizer removes payment answers when customer payments are disabled", () => {
  const answers = { goal: "simple", "accept-customer-payments": false, "customer-payment-uses": ["order"] };
  assert.deepEqual(sanitizeSectorDraftAnswers(schema, answers), {
    answers: { goal: "simple", "accept-customer-payments": false },
    changed: true,
  });
});

test("draft sanitizer preserves editable composite answers and never stores file objects", () => {
  const answers = {
    quantity: "12",
    budget: { value: "", currency: "HTG" },
    features: ["booking"],
    address: { city: "Port-au-Prince", countryCode: "HT" },
    items: [{ value: "First service" }],
    priority: ["second", "first"],
    logo: { name: "logo.png", size: 1000 },
  };
  assert.deepEqual(sanitizeSectorDraftAnswers(schema, answers), {
    answers: {
      quantity: "12",
      budget: { value: "", currency: "HTG" },
      features: ["booking"],
      address: { city: "Port-au-Prince", countryCode: "HT" },
      items: [{ value: "First service" }],
      priority: ["second", "first"],
    },
    changed: true,
  });
});

test("answer-record guard rejects null and arrays", () => {
  assert.equal(isQuestionnaireAnswerRecord(null), false);
  assert.equal(isQuestionnaireAnswerRecord([]), false);
  assert.equal(isQuestionnaireAnswerRecord({ email: "a@example.test" }), true);
});

test("only known additive sector schema migrations are automatic", () => {
  assert.equal(supportsSectorDraftMigration("1.6.0", "1.6.0"), true);
  assert.equal(supportsSectorDraftMigration("1.5.0", "1.6.0"), true);
  assert.equal(supportsSectorDraftMigration("1.0.0", "1.6.0"), true);
  assert.equal(supportsSectorDraftMigration("1.5.0", "1.5.0"), true);
  assert.equal(supportsSectorDraftMigration("1.4.0", "1.5.0"), true);
  assert.equal(supportsSectorDraftMigration("1.4.0", "1.4.0"), true);
  assert.equal(supportsSectorDraftMigration("1.0.0", "1.1.0"), true);
  assert.equal(supportsSectorDraftMigration("1.1.0", "1.2.0"), true);
  assert.equal(supportsSectorDraftMigration("1.0.0", "1.2.0"), true);
  assert.equal(supportsSectorDraftMigration("1.2.0", "1.4.0"), true);
  assert.equal(supportsSectorDraftMigration("1.3.0", "1.4.0"), true);
  assert.equal(supportsSectorDraftMigration("1.1.0", "1.4.0"), true);
  assert.equal(supportsSectorDraftMigration("1.0.0", "1.4.0"), true);
  assert.equal(supportsSectorDraftMigration("1.0.0", "1.5.0"), true);
  assert.equal(supportsSectorDraftMigration("1.2.0", "1.1.0"), false);
  assert.equal(supportsSectorDraftMigration("2.0.0", "1.2.0"), false);
});

test("revision policy distinguishes sequential updates from concurrent edits", () => {
  const input = { dirty: false, localUpdatedAt: 100, incomingUpdatedAt: 200, incomingBasedOnUpdatedAt: 100 };
  assert.equal(hasConcurrentSectorDraftEdit(input), false);
  assert.equal(hasConcurrentSectorDraftEdit({ ...input, incomingBasedOnUpdatedAt: 50 }), true);
  assert.equal(hasConcurrentSectorDraftEdit({ ...input, dirty: true }), true);
  assert.equal(hasConcurrentSectorDraftEdit({ ...input, incomingUpdatedAt: 90 }), false);
});

test("deleted draft record is a data-free tombstone", () => {
  const draft = createSectorDraftRecord({ schemaId: "sector-demo", schemaVersion: "1.2.0", answers: {}, updatedAt: 200, basedOnUpdatedAt: 100, tabId: "tab-a", deleted: true });
  assert.deepEqual(draft, { schemaId: "sector-demo", schemaVersion: "1.2.0", answers: {}, updatedAt: 200, basedOnUpdatedAt: 100, tabId: "tab-a", deleted: true });
});
