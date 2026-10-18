import test from "node:test";
import assert from "node:assert/strict";
import { deleteOwnedDemoAccount, parseAccountDeletionRequest } from "../src/account-cleanup.mjs";

test("account deletion requires an authenticated, valid uid", () => {
  assert.deepEqual(parseAccountDeletionRequest({}), { ok: false, code: "UNAUTHENTICATED" });
  assert.deepEqual(parseAccountDeletionRequest({ auth: { uid: "bad/uid" } }), { ok: false, code: "INVALID_UID" });
  assert.deepEqual(parseAccountDeletionRequest({ auth: { uid: "user_123" } }), { ok: true, uid: "user_123" });
});

test("validates every project before deleting tenant files or documents, then deletes Auth last", async () => {
  const calls = [];
  const projects = [
    { id: "education", data: () => ({ tenantId: "user_1", ownerUid: "user_1", projectId: "education" }) },
    { id: "restaurant", data: () => ({ tenantId: "user_1", ownerUid: "user_1", projectId: "restaurant" }) },
  ];
  const firestore = {
    collection: (name) => ({ doc: (uid) => ({ path: `${name}/${uid}`, collection: () => ({ get: async () => ({ docs: projects }) }) }) }),
    recursiveDelete: async (ref) => calls.push(["firestore", ref.path]),
  };
  const bucket = { deleteFiles: async (options) => calls.push(["storage", options.prefix]) };
  const authAdmin = { deleteUser: async (uid) => calls.push(["auth", uid]) };

  const result = await deleteOwnedDemoAccount({ uid: "user_1", firestore, bucket, authAdmin });
  assert.deepEqual(result, { deleted: true, projectCount: 2 });
  assert.deepEqual(calls, [
    ["storage", "sstTenants/user_1/"],
    ["firestore", "sstTenants/user_1"],
    ["auth", "user_1"],
  ]);
});

test("ownership mismatch prevents every destructive step", async () => {
  let destructiveCalls = 0;
  const tenantRef = { path: "sstTenants/user_1", collection: () => ({ get: async () => ({ docs: [{ id: "foreign", data: () => ({ tenantId: "other", ownerUid: "user_1", projectId: "foreign" }) }] }) }) };
  const firestore = { collection: () => ({ doc: () => tenantRef }), recursiveDelete: async () => destructiveCalls++ };
  const bucket = { deleteFiles: async () => destructiveCalls++ };
  const authAdmin = { deleteUser: async () => destructiveCalls++ };

  await assert.rejects(deleteOwnedDemoAccount({ uid: "user_1", firestore, bucket, authAdmin }), /ACCOUNT_OWNERSHIP_MISMATCH/);
  assert.equal(destructiveCalls, 0);
});
