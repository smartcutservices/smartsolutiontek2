/**
 * Fail-closed project access policy for trusted server callers.
 * `principal` must come from verified Firebase Auth claims; `project` and
 * `membership` must be loaded server-side. This helper is not a Firestore rule.
 */
const knownPermissions = new Set([
  "project:read",
  "project:edit",
  "project:publish",
  "project:manage-members",
  "project:manage-billing",
]);

function deny(code) {
  return Object.freeze({ allowed: false, code });
}

export function evaluateProjectAccess({ principal, project, membership, permission } = {}) {
  if (principal?.verified !== true || typeof principal.uid !== "string" || principal.uid.length === 0) {
    return deny("AUTHENTICATION_REQUIRED");
  }
  if (typeof project?.id !== "string" || project.id.length === 0
    || typeof project.tenantId !== "string" || project.tenantId.length === 0) {
    return deny("PROJECT_NOT_FOUND");
  }
  if (typeof permission !== "string" || !knownPermissions.has(permission)) {
    return deny("PERMISSION_UNKNOWN");
  }
  if (!membership || membership.status !== "active") return deny("MEMBERSHIP_INACTIVE");
  if (membership.userId !== principal.uid) return deny("MEMBERSHIP_USER_MISMATCH");
  if (membership.projectId !== project.id) return deny("MEMBERSHIP_PROJECT_MISMATCH");
  if (membership.tenantId !== project.tenantId) return deny("MEMBERSHIP_TENANT_MISMATCH");
  if (!Array.isArray(membership.permissions) || !membership.permissions.includes(permission)) {
    return deny("PERMISSION_DENIED");
  }
  return Object.freeze({ allowed: true, code: "ALLOW" });
}
