export type ProjectPermission =
  | "project:read"
  | "project:edit"
  | "project:publish"
  | "project:manage-members"
  | "project:manage-billing";

export type VerifiedPrincipal = { verified: true; uid: string };
export type ProjectReference = { id: string; tenantId: string };
export type ProjectMembership = {
  userId: string;
  projectId: string;
  tenantId: string;
  status: "active" | "suspended" | "revoked";
  permissions: ProjectPermission[];
};
export type ProjectAccessResult =
  | { allowed: true; code: "ALLOW" }
  | { allowed: false; code: string };

/** Evaluate a permission using server-verified identity and server-loaded records. */
export function evaluateProjectAccess(input: {
  principal?: VerifiedPrincipal | null;
  project?: ProjectReference | null;
  membership?: ProjectMembership | null;
  permission?: string;
}): ProjectAccessResult;
