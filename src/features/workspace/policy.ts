export const roles = ["owner", "admin", "member", "viewer"] as const;
export type Role = (typeof roles)[number];
export type Permission =
  | "read"
  | "write"
  | "delete"
  | "invite"
  | "manage-members"
  | "manage-workspace";
const grants: Record<Role, readonly Permission[]> = {
  owner: [
    "read",
    "write",
    "delete",
    "invite",
    "manage-members",
    "manage-workspace",
  ],
  admin: ["read", "write", "delete", "invite"],
  member: ["read", "write"],
  viewer: ["read"],
};
export function can(role: Role, permission: Permission) {
  return grants[role].includes(permission);
}
export class WorkspaceError extends Error {
  constructor(
    message: string,
    public code: "FORBIDDEN" | "NOT_FOUND" | "INVALID" = "INVALID",
  ) {
    super(message);
    this.name = "WorkspaceError";
  }
}
export function authorize(role: Role | undefined, permission: Permission) {
  if (!role || !can(role, permission))
    throw new WorkspaceError(
      "You do not have permission for this action.",
      "FORBIDDEN",
    );
}
