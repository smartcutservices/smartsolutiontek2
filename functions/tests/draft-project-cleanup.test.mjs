import assert from "node:assert/strict";
import test from "node:test";
import { deleteOwnedDraftProject, parseDraftProjectCleanupRequest } from "../src/draft-project-cleanup.mjs";

test("requires an authenticated user and a path-safe project ID", () => {
  assert.deepEqual(parseDraftProjectCleanupRequest({ data: { projectId: "education" } }), { ok: false, code: "UNAUTHENTICATED" });
  assert.deepEqual(parseDraftProjectCleanupRequest({ auth: { uid: "user-a" }, data: { projectId: "../other" } }), { ok: false, code: "INVALID_PROJECT_ID" });
  assert.deepEqual(parseDraftProjectCleanupRequest({ auth: { uid: "user-a" }, data: { projectId: "education" } }), { ok: true, uid: "user-a", projectId: "education" });
});

test("deletes only an owner's files and complete Firestore project subtree", async () => {
  const calls = [];
  const projectRef = { get: async () => (calls.push(["get"]), { exists: true, data: () => ({ tenantId: "user-a", ownerUid: "user-a", projectId: "education" }) }) };
  const firestore = { doc: (path) => (calls.push(["doc", path]), projectRef), recursiveDelete: async (ref) => calls.push(["recursiveDelete", ref]) };
  const bucket = { deleteFiles: async (options) => calls.push(["deleteFiles", options]) };

  const result = await deleteOwnedDraftProject({ uid: "user-a", projectId: "education", firestore, bucket });

  assert.deepEqual(result, { deleted: true, alreadyDeleted: false });
  assert.deepEqual(calls.map(([name]) => name), ["doc", "get", "deleteFiles", "recursiveDelete"]);
  assert.deepEqual(calls[2][1], { prefix: "sstTenants/user-a/projects/education/", ignoreNotFound: true });
  assert.equal(calls[3][1], projectRef);
});

test("checks project ownership before touching any Storage objects", async () => {
  let storageCleanupCalled = false;
  let recursiveDeleteCalled = false;
  const projectRef = { get: async () => ({ exists: true, data: () => ({ tenantId: "user-b", ownerUid: "user-b", projectId: "education" }) }) };
  await assert.rejects(deleteOwnedDraftProject({
    uid: "user-a", projectId: "education", firestore: { doc: () => projectRef, recursiveDelete: async () => { recursiveDeleteCalled = true; } },
    bucket: { deleteFiles: async () => { storageCleanupCalled = true; } },
  }), /PROJECT_OWNERSHIP_MISMATCH/);
  assert.equal(storageCleanupCalled, false);
  assert.equal(recursiveDeleteCalled, false);
});

test("a retry after successful cleanup is idempotent", async () => {
  let objectCleanupCalls = 0;
  const result = await deleteOwnedDraftProject({
    uid: "user-a", projectId: "education", firestore: { doc: () => ({ get: async () => ({ exists: false }) }), recursiveDelete: async () => assert.fail("must not recursively delete a missing project") },
    bucket: { deleteFiles: async () => { objectCleanupCalls += 1; } },
  });
  assert.deepEqual(result, { deleted: true, alreadyDeleted: true });
  assert.equal(objectCleanupCalls, 0);
});
