const SAFE_UID = /^[A-Za-z0-9_-]{1,128}$/;

export function parseAccountExportUid(uid) {
  if (typeof uid !== "string" || !SAFE_UID.test(uid)) throw new TypeError("Invalid account owner.");
  return uid;
}

/** Resolve only the authenticated user's tenant and refuse foreign or malformed project records. */
export async function resolveOwnedTenantExport({ uid, firestore }) {
  parseAccountExportUid(uid);
  const tenantRef = firestore.collection("sstTenants").doc(uid);
  const [tenantSnapshot, projectsSnapshot] = await Promise.all([
    tenantRef.get(),
    tenantRef.collection("projects").get(),
  ]);
  const projects = projectsSnapshot.docs;
  for (const projectRef of projects) {
    const project = projectRef.data();
    if (project.tenantId !== uid || project.ownerUid !== uid || project.projectId !== projectRef.id) {
      throw new Error("ACCOUNT_OWNERSHIP_MISMATCH");
    }
  }
  return { tenantRef, tenantSnapshot, projects };
}

/** Walk a document and every nested collection without crossing its parent document path. */
export async function* walkFirestoreDocument(ref) {
  const snapshot = await ref.get();
  if (!snapshot.exists) return;
  yield { path: ref.path, data: snapshot.data() };
  const collections = await ref.listCollections();
  for (const collection of collections) {
    const documents = await collection.get();
    for (const child of documents.docs) yield* walkFirestoreDocument(child.ref);
  }
}

