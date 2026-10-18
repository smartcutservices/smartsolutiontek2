import assert from "node:assert/strict";
import test from "node:test";
import { validateRegistrationConfig } from "../features/registration/registration-config.mjs";

function setup() {
  return {
    configVersion: "1.0.0",
    status: "draft",
    institution: { name: "Institution to configure", contactEmail: "contact@example.invalid", socialLinks: [{ platform: "website", url: "https://example.invalid" }] },
    programs: [{
      id: "program-one",
      title: "Program to configure",
      description: "Owner-provided content required before any preview.",
      availability: "scheduled",
      opensAt: "2027-01-01T00:00:00.000Z",
      closesAt: "2027-06-30T23:59:59.000Z",
      capacity: null,
      waitlistEnabled: false,
    }],
    application: {
      mode: "single",
      duplicatePolicy: "block",
      fields: [
        { id: "program-choice", type: "select", label: "Program choice", required: true, options: [{ id: "program-one", label: "Program to configure" }] },
        { id: "applicant-name", type: "text", label: "Full name", required: true },
        { id: "supporting-document", type: "file", label: "Supporting document", required: false },
        { id: "student-level", type: "select", label: "Previous level", required: false, showWhen: { fieldId: "program-choice", optionId: "program-one" }, options: [{ id: "level-one", label: "Level to configure" }] },
      ],
    },
    consents: [
      { id: "privacy-notice", kind: "privacy", label: "Privacy notice requires owner approval.", required: true },
      { id: "terms-notice", kind: "terms", label: "Terms require owner approval.", required: true },
      { id: "marketing-updates", kind: "marketing", label: "Optional updates.", required: false },
    ],
    payment: { mode: "free" },
    confirmation: { message: "Confirmation content requires owner approval.", referencePrefix: "SST" },
    uploadPolicy: { maxBytes: 5_000_000, retentionDays: 90, allowedMimeTypes: ["application/pdf", "image/jpeg"] },
  };
}

test("accepts a draft configuration with explicit privacy and upload policy", () => {
  assert.deepEqual(validateRegistrationConfig(setup()), []);
});

test("does not allow payment-provider details on a free application", () => {
  const config = setup();
  config.payment = { mode: "free", provider: "unknown" };
  assert.ok(validateRegistrationConfig(config).some((error) => error.includes("must not ask for payment-provider")));
});

test("requires disclosed program prices for paid registration", () => {
  const config = setup();
  config.payment = { mode: "paid", currency: "USD", priceByProgram: { "program-one": "25.00" } };
  assert.ok(validateRegistrationConfig(config).some((error) => error.includes("must disclose fees")));
});

test("rejects duplicate form-field IDs", () => {
  const config = setup();
  config.application.fields.push({ id: "applicant-name", type: "text", label: "Other field", required: false });
  assert.ok(validateRegistrationConfig(config).some((error) => error.includes("is duplicated")));
});

test("rejects conditional fields whose source is not an earlier unconditional select", () => {
  const config = setup();
  config.application.fields[0].showWhen = { fieldId: "student-level", optionId: "level-one" };
  assert.ok(validateRegistrationConfig(config).some((error) => error.includes("earlier, unconditional select")));
});

test("requires upload size, retention and MIME policy when file fields exist", () => {
  const config = setup();
  delete config.uploadPolicy;
  assert.ok(validateRegistrationConfig(config).some((error) => error.includes("an upload policy")));
});

test("does not allow a locally validated draft to claim it is published", () => {
  const config = setup();
  config.status = "published";
  assert.ok(validateRegistrationConfig(config).some((error) => error.includes("Only draft configurations")));
});

test("requires a positive capacity when a capacity limit is configured", () => {
  const config = setup();
  config.programs[0].capacity = 0;
  assert.ok(validateRegistrationConfig(config).some((error) => error.includes("capacity must be a positive integer")));
});

test("accepts an always-open program without scheduled timestamps", () => {
  const config = setup();
  config.programs[0].availability = "always";
  delete config.programs[0].opensAt;
  delete config.programs[0].closesAt;
  assert.deepEqual(validateRegistrationConfig(config), []);
});

test("requires privacy and terms acknowledgments to be mandatory", () => {
  const config = setup();
  config.consents[0].required = false;
  assert.ok(validateRegistrationConfig(config).some((error) => error.includes("privacy acknowledgment must be required")));
});

test("accepts a paid draft when each program has an exact decimal price and fee disclosure", () => {
  const config = setup();
  config.payment = { mode: "paid", currency: "USD", feeDisclosure: "Fees are disclosed before the applicant continues.", priceByProgram: { "program-one": "25.00" } };
  assert.deepEqual(validateRegistrationConfig(config), []);
});

test("requires social links to use HTTPS without embedded credentials", () => {
  const config = setup();
  config.institution.socialLinks[0].url = "http://example.invalid";
  assert.ok(validateRegistrationConfig(config).some((error) => error.includes("must be an HTTPS URL")));
});

test("rejects top-level fields that are not in the versioned configuration schema", () => {
  const config = setup();
  config.adminRole = "owner";
  assert.ok(validateRegistrationConfig(config).some((error) => error.includes("is not supported in configVersion")));
});

test("rejects executable or active-content MIME types in upload policy", () => {
  const config = setup();
  config.uploadPolicy.allowedMimeTypes = ["application/javascript"];
  assert.ok(validateRegistrationConfig(config).some((error) => error.includes("allowed MIME types")));
});

test("marketing consent remains optional", () => {
  const config = setup();
  config.consents[2].required = true;
  assert.ok(validateRegistrationConfig(config).some((error) => error.includes("marketing consent cannot be mandatory")));
});

test("reports malformed select options without throwing", () => {
  const config = setup();
  config.application.fields[0].options = [null];
  assert.doesNotThrow(() => validateRegistrationConfig(config));
  assert.ok(validateRegistrationConfig(config).some((error) => error.includes("select fields need unique stable option IDs")));
});

