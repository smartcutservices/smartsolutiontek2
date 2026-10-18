import test from "node:test";
import assert from "node:assert/strict";
import { customerPaymentGuidanceFor } from "../features/sectors/customer-payment-guidance.mjs";

test("gives ticketing-specific planning guidance without claiming payments are enabled", () => {
  const guidance = customerPaymentGuidanceFor({ id: "ticketing", flow: "order" });
  assert.match(guidance, /billets/);
  assert.match(guidance, /réservations de places/);
});

test("keeps donations behind legal and provider validation", () => {
  assert.match(customerPaymentGuidanceFor({ id: "fundraising", flow: "contact" }), /validation juridique/);
});

test("keeps healthcare and pharmacy profiles informational", () => {
  assert.match(customerPaymentGuidanceFor({ id: "medical-centers", flow: "booking" }), /aucune donnée médicale/);
  assert.match(customerPaymentGuidanceFor({ id: "pharmacies", flow: "content" }), /aucune vente de médicament/);
});

test("distinguishes a SaaS subscription from payments collected by its users", () => {
  const guidance = customerPaymentGuidanceFor({ id: "saas", flow: "booking" });
  assert.match(guidance, /abonnement à votre service/);
  assert.match(guidance, /paiements que votre propre site recevrait/);
});

test("falls back to guidance for the declared business flow", () => {
  assert.match(customerPaymentGuidanceFor({ id: "new-sector", flow: "order" }), /commandes/);
  assert.match(customerPaymentGuidanceFor({ id: "new-sector", flow: "unknown" }), /Aucun paiement n’est activé/);
  assert.match(customerPaymentGuidanceFor({ id: "toString", flow: "constructor" }), /Aucun paiement n’est activé/);
});
