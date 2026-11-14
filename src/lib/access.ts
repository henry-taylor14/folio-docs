/**
 * Access control. Every server-side read/write of a document goes through
 * resolveRole + can. Keep this file free of DB/framework imports so it is
 * trivially unit-testable.
 */
/** Days a deleted document stays in Recently deleted before it is purged. */
export const TRASH_DAYS = 30;

export type Role = "owner" | "editor" | "viewer";
export type Action = "read" | "edit" | "rename" | "share" | "delete" | "restore";

const PERMISSIONS: Record<Role, ReadonlySet<Action>> = {
  owner: new Set(["read", "edit", "rename", "share", "delete", "restore"]),
  editor: new Set(["read", "edit", "rename"]),
  viewer: new Set(["read"]),
};

export function resolveRole(
  userId: string,
  doc: { ownerId: string },
  shares: ReadonlyArray<{ userId: string; role: "viewer" | "editor" }>,
): Role | null {
  if (doc.ownerId === userId) return "owner";
  const share = shares.find((s) => s.userId === userId);
  return share ? share.role : null;
}

export function can(role: Role | null, action: Action): boolean {
  return role !== null && PERMISSIONS[role].has(action);
}
