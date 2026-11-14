import { describe, expect, it } from "vitest";
import { can, resolveRole, type Action, type Role } from "@/lib/access";

const doc = { ownerId: "alice" };
const shares = [
  { userId: "bob", role: "editor" as const },
  { userId: "carol", role: "viewer" as const },
];

describe("resolveRole", () => {
  it("gives the owner the owner role", () => {
    expect(resolveRole("alice", doc, shares)).toBe("owner");
  });
  it("uses the share role for shared users", () => {
    expect(resolveRole("bob", doc, shares)).toBe("editor");
    expect(resolveRole("carol", doc, shares)).toBe("viewer");
  });
  it("returns null for users with no access", () => {
    expect(resolveRole("mallory", doc, shares)).toBeNull();
  });
  it("prefers ownership over a stray share row for the owner", () => {
    expect(resolveRole("alice", doc, [{ userId: "alice", role: "viewer" }])).toBe("owner");
  });
});

describe("can", () => {
  const matrix: Record<Role, Record<Action, boolean>> = {
    owner: { read: true, edit: true, rename: true, share: true, delete: true, restore: true },
    editor: { read: true, edit: true, rename: true, share: false, delete: false, restore: false },
    viewer: { read: true, edit: false, rename: false, share: false, delete: false, restore: false },
  };

  for (const [role, actions] of Object.entries(matrix) as [Role, Record<Action, boolean>][]) {
    for (const [action, allowed] of Object.entries(actions) as [Action, boolean][]) {
      it(`${role} ${allowed ? "can" : "cannot"} ${action}`, () => {
        expect(can(role, action)).toBe(allowed);
      });
    }
  }

  it("denies everything when there is no role", () => {
    for (const action of ["read", "edit", "rename", "share", "delete", "restore"] as Action[]) {
      expect(can(null, action)).toBe(false);
    }
  });
});
