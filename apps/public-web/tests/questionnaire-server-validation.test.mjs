import assert from "node:assert/strict";
import test from "node:test";
import { handleQuestionnaireValidationRequest, readBoundedJsonBody, validateQuestionnaireRequest } from "../features/questionnaire/server-validation.mjs";

const schema = {
  schemaId: "sector-example", schemaVersion: "1.0.0", locale: "fr-HT",
  questions: [
    { id: "goal", version: "1.0.0", type: "singleChoice", label: "Goal", required: true, options: [{ id: "shop", label: "Shop" }, { id: "service", label: "Service" }] },
    { id: "details", version: "1.0.0", type: "shortText", label: "Details", required: true, visibilityRules: [{ questionId: "goal", operator: "equals", value: "shop" }], dependencies: ["goal"] },
  ],
};
const resolveSchema = (sectorId) => sectorId === "example" ? schema : undefined;
const requestBody = (answers, overrides = {}) => ({ sectorId: "example", schemaId: "sector-example", schemaVersion: "1.0.0", answers, ...overrides });

test("server contract accepts a valid branch against the trusted schema", () => {
  assert.deepEqual(validateQuestionnaireRequest(requestBody({ goal: "shop", details: "Public details" }), resolveSchema), {
    status: 200, body: { ok: true, schemaId: "sector-example", schemaVersion: "1.0.0", errors: [] },
  });
});

test("server contract rejects missing required answers and stale hidden values", () => {
  assert.equal(validateQuestionnaireRequest(requestBody({ goal: "shop" }), resolveSchema).status, 422);
  const stale = validateQuestionnaireRequest(requestBody({ goal: "service", details: "Hidden from this branch" }), resolveSchema);
  assert.equal(stale.status, 422);
  assert.equal(stale.body.code, "answers-invalid");
  assert.equal(stale.body.errors[0].code, "inapplicable-answer");
});

test("server contract rejects unknown sectors, schema mismatches and stale versions", () => {
  assert.equal(validateQuestionnaireRequest(requestBody({}), () => undefined).status, 404);
  assert.equal(validateQuestionnaireRequest(requestBody({}, { schemaId: "sector-other" }), resolveSchema).status, 400);
  const stale = validateQuestionnaireRequest(requestBody({}, { schemaVersion: "0.9.0" }), resolveSchema);
  assert.equal(stale.status, 409);
  assert.equal(stale.body.currentSchemaVersion, "1.0.0");
});

test("server contract rejects extra request keys rather than trusting a client schema", () => {
  assert.equal(validateQuestionnaireRequest(requestBody({}, { schema: { questions: [] } }), resolveSchema).status, 400);
});

test("bounded JSON reader rejects malformed and oversized bodies", async () => {
  const malformed = await readBoundedJsonBody(new Request("https://example.test", { method: "POST", body: "{" }));
  assert.deepEqual(malformed, { ok: false, status: 400, code: "invalid-json" });
  const oversized = await readBoundedJsonBody(new Request("https://example.test", { method: "POST", headers: { "content-type": "application/json", "content-length": "20" }, body: "{}" }), 10);
  assert.deepEqual(oversized, { ok: false, status: 413, code: "body-too-large" });
  const streamed = await readBoundedJsonBody({
    headers: new Headers(),
    body: new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(11)); controller.close(); } }),
  }, 10);
  assert.deepEqual(streamed, { ok: false, status: 413, code: "body-too-large" });
});

test("HTTP handler validates JSON and returns non-cacheable safe responses", async () => {
  const request = new Request("https://example.test/api/questionnaire/validate", {
    method: "POST", headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(requestBody({ goal: "shop", details: "Public details" })),
  });
  const response = await handleQuestionnaireValidationRequest(request, resolveSchema);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store, max-age=0");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.deepEqual(await response.json(), { ok: true, schemaId: "sector-example", schemaVersion: "1.0.0", errors: [] });
});

test("HTTP handler rejects wrong media type, malformed JSON and oversized content length", async () => {
  const wrongType = await handleQuestionnaireValidationRequest(new Request("https://example.test", { method: "POST", body: "{}" }), resolveSchema);
  assert.equal(wrongType.status, 415);
  const malformed = await handleQuestionnaireValidationRequest(new Request("https://example.test", { method: "POST", headers: { "content-type": "application/json" }, body: "{" }), resolveSchema);
  assert.equal(malformed.status, 400);
  const oversized = await handleQuestionnaireValidationRequest(new Request("https://example.test", { method: "POST", headers: { "content-type": "application/json", "content-length": "70000" }, body: "{}" }), resolveSchema);
  assert.equal(oversized.status, 413);
});
