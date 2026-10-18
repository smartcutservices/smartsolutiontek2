import test from "node:test";
import assert from "node:assert/strict";
import { getSectorPreviewCopy } from "../features/sectors/preview-copy.mjs";

test("uses campaign context in the hero when no custom offer is set", () => {
  const preview = getSectorPreviewCopy({
    configuration: { "project-goal": "campaign", "campaign-context": "Summer enrollment" },
    sectorDetail: "Education services",
  });
  assert.equal(preview.heroDescription, "Summer enrollment");
});

test("uses redesign priorities in the hero when no custom offer is set", () => {
  const preview = getSectorPreviewCopy({
    configuration: { "project-goal": "redesign", "redesign-focus": "Keep the current course list" },
    sectorDetail: "Education services",
  });
  assert.equal(preview.heroDescription, "Keep the current course list");
});

test("configured offer takes precedence and action details reach the preview", () => {
  const preview = getSectorPreviewCopy({
    configuration: {
      "project-goal": "campaign",
      "campaign-context": "Campaign context",
      "hero-copy": "Our current offer",
      "action-details": "Bring a valid application number",
    },
    sectorDetail: "Education services",
  });
  assert.deepEqual(preview, {
    heroDescription: "Our current offer",
    actionDescription: "Bring a valid application number",
  });
});

test("falls back safely when optional text answers are absent or invalid", () => {
  const preview = getSectorPreviewCopy({
    configuration: { "campaign-context": { unexpected: true }, "action-details": 42 },
    sectorDetail: "Education services",
  });
  assert.equal(preview.heroDescription, "Education services");
  assert.equal(preview.actionDescription, "");
});
