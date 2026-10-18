import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test, { after, before, beforeEach } from "node:test";
import { fileURLToPath } from "node:url";
import { assertFails, assertSucceeds, initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { deleteObject, getBytes, ref, uploadBytes } from "firebase/storage";

const projectId = "demo-smartsolutiontek";
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const rules = await readFile(path.join(projectRoot, "storage.rules"), "utf8");
let environment;

function quarantinePath(uid, name) {
  return `sstTenants/${uid}/projects/education/drafts/quarantine/${name}.${randomUUID()}.png`;
}

function storageFor(uid) {
  const context = uid ? environment.authenticatedContext(uid) : environment.unauthenticatedContext();
  return context.storage(`gs://${projectId}.appspot.com`);
}

before(async () => {
  environment = await initializeTestEnvironment({
    projectId,
    storage: { host: "127.0.0.1", port: 9199, rules },
  });
});

beforeEach(async () => environment.clearStorage());
after(async () => environment?.cleanup());

test("owner can only create a private quarantine upload and delete it", async () => {
  const image = ref(storageFor("user-a"), quarantinePath("user-a", "hero"));
  await assertSucceeds(uploadBytes(image, new Uint8Array([137, 80, 78, 71]), { contentType: "image/png" }));
  await assertFails(uploadBytes(image, new Uint8Array([137, 80, 78, 71, 1]), { contentType: "image/png" }));
  await assertFails(getBytes(image));
  await assertSucceeds(deleteObject(image));
});

test("owner can read and delete processed variants but cannot forge them", async () => {
  const imagePath = "sstTenants/user-a/projects/education/drafts/images/hero/hash/w640.webp";
  const image = ref(storageFor("user-a"), imagePath);
  await environment.withSecurityRulesDisabled(async (context) => {
    await uploadBytes(ref(context.storage(`gs://${projectId}.appspot.com`), imagePath), new Uint8Array([82, 73, 70, 70]), { contentType: "image/webp" });
  });
  await assertSucceeds(getBytes(image));
  await assertFails(uploadBytes(image, new Uint8Array([82, 73, 70, 70, 1]), { contentType: "image/webp" }));
  await assertSucceeds(deleteObject(image));
});

test("anonymous and cross-owner users cannot access an image", async () => {
  const ownerImage = ref(storageFor("user-a"), quarantinePath("user-a", "logo"));
  await assertSucceeds(uploadBytes(ownerImage, new Uint8Array([82, 73, 70, 70]), { contentType: "image/webp" }));
  await assertFails(uploadBytes(ref(storageFor(null), ownerImage.fullPath), new Uint8Array([1]), { contentType: "image/png" }));
  await assertFails(uploadBytes(ref(storageFor("user-b"), ownerImage.fullPath), new Uint8Array([1]), { contentType: "image/png" }));
  await assertFails(uploadBytes(ref(storageFor("user-a"), quarantinePath("user-b", "attack")), new Uint8Array([1]), { contentType: "image/png" }));
});

test("uploads with unsupported content types or excessive size are denied", async () => {
  const storage = storageFor("user-a");
  await assertFails(uploadBytes(ref(storage, quarantinePath("user-a", "not-an-image").replace(/\.png$/, ".txt")), new Uint8Array([1]), { contentType: "text/plain" }));
  await assertFails(uploadBytes(ref(storage, quarantinePath("user-a", "animated").replace(/\.png$/, ".gif")), new Uint8Array([1]), { contentType: "image/gif" }));
  await assertFails(uploadBytes(ref(storage, quarantinePath("user-a", "too-large")), new Uint8Array(8 * 1024 * 1024 + 1), { contentType: "image/png" }));
});
