import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test, { after, before, beforeEach } from "node:test";
import { fileURLToPath } from "node:url";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

const projectId = "demo-smartsolutiontek";
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const rules = await readFile(path.join(projectRoot, "firestore.rules"), "utf8");
let environment;

const membership = (userId, tenantId, projectId, permissions, status = "active") => ({
  userId,
  tenantId,
  projectId,
  status,
  permissions,
});

const editorConfiguration = (title) => ({
  text: { title }, links: {}, accent: "", images: {}, altTexts: {}, fields: {},
  sectionOrder: [], hiddenSections: [], addedSections: [],
});

const draft = (tenantId, projectId, createdByUid, revision = 1) => ({
  tenantId,
  projectId,
  createdByUid,
  templateId: "education",
  schemaVersion: 1,
  revision,
  configuration: editorConfiguration("Local draft"),
  updatedAt: serverTimestamp(),
});

function dbFor(uid) {
  return environment.authenticatedContext(uid).firestore();
}

function projectPath(tenantId = "tenant-a", projectId = "project-a") {
  return `sstTenants/${tenantId}/projects/${projectId}`;
}

before(async () => {
  environment = await initializeTestEnvironment({
    projectId,
    firestore: { host: "127.0.0.1", port: 8080, rules },
  });
});

beforeEach(async () => {
  await environment.clearFirestore();
  await environment.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, projectPath()), { tenantId: "tenant-a", projectId: "project-a", name: "A" });
    await setDoc(doc(db, projectPath("tenant-b", "project-b")), { tenantId: "tenant-b", projectId: "project-b", name: "B" });
    await setDoc(doc(db, projectPath("user-a", "project-c")), { tenantId: "user-a", projectId: "project-c", name: "C" });
    await setDoc(doc(db, `${projectPath()}/memberships/user-a`), membership("user-a", "tenant-a", "project-a", ["project:read", "project:edit"]));
    await setDoc(doc(db, `${projectPath()}/memberships/user-viewer`), membership("user-viewer", "tenant-a", "project-a", ["project:read"]));
    await setDoc(doc(db, `${projectPath()}/memberships/user-suspended`), membership("user-suspended", "tenant-a", "project-a", ["project:read", "project:edit"], "suspended"));
    await setDoc(doc(db, `${projectPath("tenant-b", "project-b")}/memberships/user-b`), membership("user-b", "tenant-b", "project-b", ["project:read", "project:edit"]));
    await setDoc(doc(db, `${projectPath("user-a", "project-c")}/memberships/user-a`), membership("user-a", "user-a", "project-c", ["project:read", "project:edit"]));
    await setDoc(doc(db, `${projectPath()}/drafts/project-a`), {
      tenantId: "tenant-a", projectId: "project-a", createdByUid: "user-a", templateId: "education",
      schemaVersion: 1, revision: 1, configuration: editorConfiguration("A"), updatedAt: new Date(),
    });
    await setDoc(doc(db, `${projectPath("tenant-b", "project-b")}/drafts/project-b`), {
      tenantId: "tenant-b", projectId: "project-b", createdByUid: "user-b", templateId: "education",
      schemaVersion: 1, revision: 1, configuration: editorConfiguration("B"), updatedAt: new Date(),
    });
  });
});

after(async () => {
  await environment?.cleanup();
});

test("active member can read its project, own membership, and drafts", async () => {
  const db = dbFor("user-a");
  await assertSucceeds(getDoc(doc(db, projectPath())));
  await assertSucceeds(getDoc(doc(db, `${projectPath()}/memberships/user-a`)));
  await assertSucceeds(getDoc(doc(db, `${projectPath()}/drafts/project-a`)));
});

test("active editor can create and update only a valid draft with increasing revision", async () => {
  const db = dbFor("user-a");
  const newDraft = doc(db, `${projectPath("user-a", "project-c")}/drafts/project-c`);
  await assertSucceeds(setDoc(newDraft, draft("user-a", "project-c", "user-a")));
  await assertSucceeds(updateDoc(newDraft, { tenantId: "user-a", projectId: "project-c", configuration: editorConfiguration("Updated"), revision: 2, updatedAt: serverTimestamp() }));
  await assertFails(updateDoc(newDraft, { configuration: editorConfiguration("Skipped revision"), revision: 5, updatedAt: serverTimestamp() }));
  await assertFails(setDoc(doc(db, `${projectPath("user-a", "project-c")}/drafts/another-draft`), draft("user-a", "project-c", "user-a")));
});

test("editor rules reject invalid colors and excessive dynamic maps", async () => {
  const db = dbFor("user-a");
  const canonicalDraft = doc(db, `${projectPath()}/drafts/project-a`);
  const base = editorConfiguration("Bounded");
  const overLimit = (count) => Object.fromEntries(Array.from({ length: count }, (_, index) => [`entry-${index}`, "value"]));
  const invalidConfigurations = [
    { ...base, accent: "red; background:url(javascript:alert(1))" },
    { ...base, text: overLimit(181) },
    { ...base, links: overLimit(181) },
    { ...base, altTexts: overLimit(41) },
    { ...base, fields: overLimit(201) },
  ];
  for (const configuration of invalidConfigurations) {
    await assertFails(updateDoc(canonicalDraft, { configuration, revision: 2, updatedAt: serverTimestamp() }));
  }
});

test("a user can create only its own draft project and owner membership atomically", async () => {
  const db = dbFor("user-new");
  const project = doc(db, projectPath("user-new", "project-new"));
  const ownMembership = doc(db, `${projectPath("user-new", "project-new")}/memberships/user-new`);
  const batch = writeBatch(db);
  batch.set(project, {
    tenantId: "user-new", projectId: "project-new", ownerUid: "user-new", templateId: "education",
    name: "École de démonstration", status: "draft", createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });
  batch.set(ownMembership, {
    userId: "user-new", tenantId: "user-new", projectId: "project-new", role: "owner", status: "active",
    permissions: ["project:read", "project:edit"], createdAt: serverTimestamp(),
  });
  batch.set(doc(db, `${projectPath("user-new", "project-new")}/drafts/project-new`), draft("user-new", "project-new", "user-new"));
  await assertSucceeds(batch.commit());
  await assertSucceeds(getDoc(project));
  await assertSucceeds(getDoc(ownMembership));
  await assertSucceeds(getDoc(doc(db, `${projectPath("user-new", "project-new")}/drafts/project-new`)));
});

test("project creation fails without a matching owner membership or with elevated client grants", async () => {
  const db = dbFor("user-new");
  await assertFails(setDoc(doc(db, projectPath("user-new", "unpaired")), {
    tenantId: "user-new", projectId: "unpaired", ownerUid: "user-new", templateId: "education",
    name: "Unpaired", status: "draft", createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  }));

  const elevatedBatch = writeBatch(db);
  elevatedBatch.set(doc(db, projectPath("user-new", "elevated")), {
    tenantId: "user-new", projectId: "elevated", ownerUid: "user-new", templateId: "education",
    name: "Elevated", status: "draft", createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });
  elevatedBatch.set(doc(db, `${projectPath("user-new", "elevated")}/memberships/user-new`), {
    userId: "user-new", tenantId: "user-new", projectId: "elevated", role: "owner", status: "active",
    permissions: ["project:read", "project:edit", "project:manage-billing"], createdAt: serverTimestamp(),
  });
  await assertFails(elevatedBatch.commit());
  await assertFails(setDoc(doc(db, `${projectPath("user-new", "project-new")}/memberships/other-user`), membership("other-user", "user-new", "project-new", ["project:edit"])));
});

test("member cannot read or write another tenant's project or draft", async () => {
  const dbA = dbFor("user-a");
  const dbB = dbFor("user-b");
  await assertFails(getDoc(doc(dbA, projectPath("tenant-b", "project-b"))));
  await assertFails(getDoc(doc(dbA, `${projectPath("tenant-b", "project-b")}/drafts/project-b`)));
  await assertFails(setDoc(doc(dbA, `${projectPath("tenant-b", "project-b")}/drafts/project-b`), draft("tenant-b", "project-b", "user-a")));
  await assertFails(getDoc(doc(dbB, projectPath())));
  await assertFails(getDoc(doc(dbB, `${projectPath()}/drafts/project-a`)));
  await assertFails(setDoc(doc(dbB, `${projectPath()}/drafts/project-a`), draft("tenant-a", "project-a", "user-b")));
  await assertFails(setDoc(doc(dbA, `${projectPath()}/drafts/project-a`), draft("tenant-b", "project-b", "user-a")));
});

test("read-only membership cannot edit drafts and role labels grant no extra rights", async () => {
  const db = dbFor("user-viewer");
  await assertSucceeds(getDoc(doc(db, `${projectPath()}/drafts/project-a`)));
  await assertFails(updateDoc(doc(db, `${projectPath()}/drafts/project-a`), { configuration: editorConfiguration("Read only"), revision: 2, updatedAt: serverTimestamp() }));
  await environment.withSecurityRulesDisabled(async (context) => {
    await updateDoc(doc(context.firestore(), `${projectPath()}/memberships/user-viewer`), { role: "owner" });
  });
  await assertFails(updateDoc(doc(db, `${projectPath()}/drafts/project-a`), { configuration: editorConfiguration("Forged role"), revision: 2, updatedAt: serverTimestamp() }));
});

test("suspended, unauthenticated, and cross-user membership access is denied", async () => {
  const suspendedDb = dbFor("user-suspended");
  await assertFails(getDoc(doc(suspendedDb, projectPath())));
  await assertFails(updateDoc(doc(suspendedDb, `${projectPath()}/drafts/project-a`), { configuration: editorConfiguration("Suspended"), revision: 2, updatedAt: serverTimestamp() }));
  await assertFails(getDoc(doc(environment.unauthenticatedContext().firestore(), projectPath())));
  await assertFails(getDoc(doc(dbFor("user-a"), `${projectPath()}/memberships/user-viewer`)));
});

test("clients cannot change memberships, enumerate projects, publish drafts, or access unknown paths", async () => {
  const db = dbFor("user-a");
  await assertFails(updateDoc(doc(db, `${projectPath()}/memberships/user-a`), { permissions: ["project:manage-billing"] }));
  await assertFails(setDoc(doc(db, `${projectPath()}/memberships/attacker`), membership("attacker", "tenant-a", "project-a", ["project:edit"])));
  await assertFails(getDocs(collection(db, `${projectPath()}/memberships`)));
  await assertFails(getDocs(collection(db, `${projectPath()}/drafts`)));
  await assertFails(getDocs(collection(db, "sstTenants/tenant-a/projects")));
  await assertFails(setDoc(doc(db, projectPath("tenant-a", "client-created-project")), { tenantId: "tenant-a", projectId: "client-created-project" }));
  await assertFails(updateDoc(doc(db, `${projectPath()}/drafts/project-a`), { published: true, revision: 2, updatedAt: serverTimestamp() }));
  await assertFails(getDoc(doc(db, "privateUsers/user-a")));
  await assertFails(deleteDoc(doc(db, projectPath())));
});
