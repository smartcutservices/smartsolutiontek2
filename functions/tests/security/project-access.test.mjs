import assert from "node:assert/strict";
import test from "node:test";
import { evaluateProjectAccess } from "../../src/security/project-access.mjs";

const principal = { verified: true, uid: "user-a" };
const project = { id: "project-a", tenantId: "tenant-a" };
const membership = {
  userId: "user-a",
  projectId: "project-a",
  tenantId: "tenant-a",
  status: "active",
  permissions: ["project:read", "project:edit"],
};

test("allows a known permission only when verified identity and membership match", () => {
  assert.deepEqual(evaluateProjectAccess({ principal, project, membership, permission: "project:edit" }), {
    allowed: true,
    code: "ALLOW",
  });
});

test("denies anonymous and unverified principals", () => {
  assert.equal(evaluateProjectAccess({ project, membership, permission: "project:read" }).code, "AUTHENTICATION_REQUIRED");
  assert.equal(evaluateProjectAccess({ principal: { ...principal, verified: false }, project, membership, permission: "project:read" }).code, "AUTHENTICATION_REQUIRED");
});

test("denies missing project records and unknown permissions", () => {
  assert.equal(evaluateProjectAccess({ principal, membership, permission: "project:read" }).code, "PROJECT_NOT_FOUND");
  assert.equal(evaluateProjectAccess({ principal, project, membership, permission: "project:delete-everything" }).code, "PERMISSION_UNKNOWN");
});

test("denies suspended and revoked memberships", () => {
  assert.equal(evaluateProjectAccess({ principal, project, membership: { ...membership, status: "suspended" }, permission: "project:read" }).code, "MEMBERSHIP_INACTIVE");
  assert.equal(evaluateProjectAccess({ principal, project, membership: { ...membership, status: "revoked" }, permission: "project:read" }).code, "MEMBERSHIP_INACTIVE");
});

test("denies mismatched user, project, or tenant membership", () => {
  assert.equal(evaluateProjectAccess({ principal, project, membership: { ...membership, userId: "user-b" }, permission: "project:read" }).code, "MEMBERSHIP_USER_MISMATCH");
  assert.equal(evaluateProjectAccess({ principal, project, membership: { ...membership, projectId: "project-b" }, permission: "project:read" }).code, "MEMBERSHIP_PROJECT_MISMATCH");
  assert.equal(evaluateProjectAccess({ principal, project, membership: { ...membership, tenantId: "tenant-b" }, permission: "project:read" }).code, "MEMBERSHIP_TENANT_MISMATCH");
});

test("denies permissions not present in the server-loaded membership", () => {
  assert.equal(evaluateProjectAccess({ principal, project, membership, permission: "project:publish" }).code, "PERMISSION_DENIED");
  assert.equal(evaluateProjectAccess({ principal, project, membership: { ...membership, permissions: "project:read" }, permission: "project:read" }).code, "PERMISSION_DENIED");
});

test("does not trust a role name without an explicit permission", () => {
  const roleOnly = { userId: "user-a", projectId: "project-a", tenantId: "tenant-a", status: "active", role: "owner" };
  assert.equal(evaluateProjectAccess({ principal, project, membership: roleOnly, permission: "project:manage-billing" }).code, "PERMISSION_DENIED");
});
