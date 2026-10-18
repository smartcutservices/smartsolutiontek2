import test from "node:test";
import assert from "node:assert/strict";
import { getSectorSectionLabels } from "../features/sectors/section-labels.mjs";

test("ticketing labels describe an event and ticket journey", () => {
  const labels = getSectorSectionLabels({ id: "ticketing", flow: "registration" });
  assert.equal(labels.services, "Programme et billets");
  assert.equal(labels.contact, "Accès et informations");
  assert.equal(labels.payments, "Billetterie à configurer");
});

test("order and application flows receive relevant default labels", () => {
  assert.equal(getSectorSectionLabels({ id: "generic", flow: "order" }).contact, "Commande et retrait");
  assert.equal(getSectorSectionLabels({ id: "generic", flow: "application" }).contact, "Candidature et inscription");
});

test("sector overrides refine flow labels", () => {
  const labels = getSectorSectionLabels({ id: "cafes-snacks", flow: "order" });
  assert.equal(labels.services, "Menu et formules");
  assert.equal(labels.gallery, "Produits et espace");
});

test("labels always retain all stable section IDs and have safe fallbacks", () => {
  const ids = ["overview", "services", "gallery", "testimonials", "contact", "payments"];
  assert.deepEqual(Object.keys(getSectorSectionLabels(undefined)), ids);
  assert.ok(Object.values(getSectorSectionLabels(undefined)).every((label) => typeof label === "string" && label.length > 0));
});
