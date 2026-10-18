const SAFE_PROJECT_ID = /^[a-z0-9][a-z0-9-]{0,79}$/;

export function parseDraftProjectCleanupRequest({ data, auth } = {}) {
  if (!auth?.uid) return { ok: false, code: "UNAUTHENTICATED" };
  const projectId = data?.projectId;
  if (typeof projectId !== "string" || !SAFE_PROJECT_ID.test(projectId)) {
    return { ok: false, code: "INVALID_PROJECT_ID" };
  }
  return { ok: true, uid: auth.uid, projectId };
}

/** Remove only the authenticated owner's draft project, subcollections, and stored files. */
export async function deleteOwnedDraftProject({ uid, projectId, firestore, bucket }) {
  if (!uid || !SAFE_PROJECT_ID.test(projectId || "")) throw new TypeError("Invalid owner or project ID.");

  const projectPath = `sstTenants/${uid}/projects/${projectId}`;
  const projectRef = firestore.doc(projectPath);
  const snapshot = await projectRef.get();
  if (!snapshot.exists) return { deleted: true, alreadyDeleted: true };

  const project = snapshot.data();
  if (project.tenantId !== uid || project.ownerUid !== uid || project.projectId !== projectId) {
    throw new Error("PROJECT_OWNERSHIP_MISMATCH");
  }

  // Storage is cleaned before Firestore so a retry can safely finish after partial failure.
  await bucket.deleteFiles({ prefix: `${projectPath}/`, ignoreNotFound: true });
  await firestore.recursiveDelete(projectRef);
  return { deleted: true, alreadyDeleted: false };
}
