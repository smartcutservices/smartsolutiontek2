import test from "node:test";
import assert from "node:assert/strict";
import { resolveOwnedTenantExport, walkFirestoreDocument } from "../src/account-export.mjs";

test("resolves only a UID tenant and verifies every project before export", async () => {
  const projects = [
    { id: "education", data: () => ({ tenantId: "owner_1", ownerUid: "owner_1", projectId: "education" }) },
  ];
  const tenantRef = {
    path: "sstTenants/owner_1",
    get: async () => ({ exists: true, data: () => ({ uid: "owner_1", displayName: "Demo" }) }),
    collection: (name) => ({ get: async () => ({ docs: name === "projects" ? projects : [] }) }),
  };
  const result = await resolveOwnedTenantExport({ uid: "owner_1", firestore: { collection: () => ({ doc: () => tenantRef }) } });
  assert.equal(result.tenantRef.path, "sstTenants/owner_1");
  assert.deepEqual(result.projects.map((project) => project.id), ["education"]);
});

test("rejects foreign tenant project data before returning an export scope", async () => {
  let reads = 0;
  const tenantRef = {
    get: async () => ({ exists: true, data: () => ({ uid: "owner_1" }) }),
    collection: () => ({ get: async () => ({ docs: [{ id: "foreign", data: () => ({ tenantId: "other", ownerUid: "owner_1", projectId: "foreign" }) }] }) }),
  };
  await assert.rejects(resolveOwnedTenantExport({ uid: "owner_1", firestore: { collection: () => ({ doc: () => tenantRef }) } }), /ACCOUNT_OWNERSHIP_MISMATCH/);
  assert.equal(reads, 0);
});

test("walks nested Firestore documents and retains canonical paths", async () => {
  const nestedRef = { path: "sstTenants/owner_1/projects/education/drafts/education", get: async () => ({ exists: true, data: () => ({ revision: 2 }) }), listCollections: async () => [] };
  const draftCollection = { get: async () => ({ docs: [{ id: "education", ref: nestedRef }] }) };
  const projectRef = { path: "sstTenants/owner_1/projects/education", get: async () => ({ exists: true, data: () => ({ tenantId: "owner_1" }) }), listCollections: async () => [draftCollection] };
  const rows = [];
  for await (const row of walkFirestoreDocument(projectRef)) rows.push(row);
  assert.deepEqual(rows, [
    { path: "sstTenants/owner_1/projects/education", data: { tenantId: "owner_1" } },
    { path: "sstTenants/owner_1/projects/education/drafts/education", data: { revision: 2 } },
  ]);
});

test("rejects unsafe account identifiers", async () => {
  await assert.rejects(resolveOwnedTenantExport({ uid: "owner/other", firestore: {} }), /Invalid account owner/);
});
