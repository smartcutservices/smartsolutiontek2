const SAFE_UID = /^[A-Za-z0-9_-]{1,128}$/;
const DEMO_PROJECT_ID = "demo-smartsolutiontek";

export function parseAccountDeletionRequest({ auth } = {}) {
  if (!auth?.uid) return { ok: false, code: "UNAUTHENTICATED" };
  if (!SAFE_UID.test(auth.uid)) return { ok: false, code: "INVALID_UID" };
  return { ok: true, uid: auth.uid };
}

/** Delete only the caller's complete demo tenant; validate every project before removing any data. */
export async function deleteOwnedDemoAccount({ uid, firestore, bucket, authAdmin }) {
  if (!SAFE_UID.test(uid || "")) throw new TypeError("Invalid account owner.");
  const tenantRef = firestore.collection("sstTenants").doc(uid);
  const projectsSnapshot = await tenantRef.collection("projects").get();
  const projects = projectsSnapshot.docs;

  for (const projectRef of projects) {
    const project = projectRef.data();
    if (project.tenantId !== uid || project.ownerUid !== uid || project.projectId !== projectRef.id) {
      throw new Error("ACCOUNT_OWNERSHIP_MISMATCH");
    }
  }

  // Storage is removed first. If a later step fails, retrying this callable is safe.
  await bucket.deleteFiles({ prefix: `sstTenants/${uid}/`, ignoreNotFound: true });
  await firestore.recursiveDelete(tenantRef);
  await authAdmin.deleteUser(uid);
  return { deleted: true, projectCount: projects.length };
}

export const DEMO_ACCOUNT_DELETION_PROJECT_ID = DEMO_PROJECT_ID;
