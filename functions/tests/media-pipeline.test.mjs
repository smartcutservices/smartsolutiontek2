import test from "node:test";
import assert from "node:assert/strict";
import { parseDraftImagePath, processUploadedDraftImage, responsiveImageWidths } from "../src/media/process-draft-image.mjs";

test("accepts an owner-scoped quarantine image path and restores its editor key", () => {
  const uploadId = "7af13573-1371-45a7-87d4-e5be2c6d07c1";
  const result = parseDraftImagePath(`sstTenants/user-1/projects/education/drafts/quarantine/${encodeURIComponent("image-hero-0")}.${uploadId}.webp`);
  assert.deepEqual(result, {
    tenantId: "user-1",
    projectId: "education",
    key: "image-hero-0",
    uploadId,
    extension: "webp",
  });
});

test("ignores paths outside quarantine and rejects encoded separators or invalid names", () => {
  const uploadId = "7af13573-1371-45a7-87d4-e5be2c6d07c1";
  assert.equal(parseDraftImagePath(`sstTenants/user-1/projects/education/drafts/images/hero/${uploadId}/w640.webp`), null);
  assert.equal(parseDraftImagePath(`sstTenants/user-1/projects/education/drafts/quarantine/${encodeURIComponent("../other")}.${uploadId}.webp`), null);
  assert.equal(parseDraftImagePath("sstTenants/user-1/projects/education/drafts/quarantine/not-an-image.webp"), null);
});

test("creates proportional responsive widths without enlarging smaller source images", () => {
  assert.deepEqual(responsiveImageWidths(240), [240]);
  assert.deepEqual(responsiveImageWidths(1280), [320, 640, 960, 1280]);
  assert.deepEqual(responsiveImageWidths(4000), [320, 640, 960, 1280, 1920]);
  assert.deepEqual(responsiveImageWidths(0), []);
});

test("ignores generated variants without deleting them when the storage trigger runs again", async () => {
  const deleted = [];
  const bucket = { name: "demo-smartsolutiontek.appspot.com", file: (name) => ({ delete: async () => deleted.push(name) }) };
  const result = await processUploadedDraftImage({
    eventData: { bucket: bucket.name, name: "sstTenants/user-1/projects/education/drafts/images/hero/hash/w1280.webp" },
    bucket,
  });
  assert.deepEqual(result, { status: "ignored" });
  assert.deepEqual(deleted, []);
});

test("removes only malformed objects inside the quarantine upload folder", async () => {
  const deleted = [];
  const bucket = { name: "demo-smartsolutiontek.appspot.com", file: (name) => ({ delete: async () => deleted.push(name) }) };
  const malformed = "sstTenants/user-1/projects/education/drafts/quarantine/not-an-image.webp";
  const unrelated = "sstTenants/user-1/projects/education/drafts/images/hero/w1280.webp";
  await processUploadedDraftImage({ eventData: { bucket: bucket.name, name: malformed }, bucket });
  await processUploadedDraftImage({ eventData: { bucket: "another-bucket", name: "sstTenants/user-1/projects/education/drafts/quarantine/bad.webp" }, bucket });
  await processUploadedDraftImage({ eventData: { bucket: bucket.name, name: unrelated }, bucket });
  assert.deepEqual(deleted, [malformed]);
});
