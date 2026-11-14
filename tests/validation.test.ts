import { describe, expect, it } from "vitest";
import { signupSchema } from "@/lib/validation";

describe("signupSchema", () => {
  it("normalizes email and trims name", () => {
    const r = signupSchema.parse({ name: " Dana ", email: " Dana@Example.com ", password: "longenough" });
    expect(r).toMatchObject({ name: "Dana", email: "dana@example.com" });
  });
  it("rejects short passwords, blank names and bad emails", () => {
    expect(signupSchema.safeParse({ name: "D", email: "d@example.com", password: "short" }).success).toBe(false);
    expect(signupSchema.safeParse({ name: "  ", email: "d@example.com", password: "longenough" }).success).toBe(false);
    expect(signupSchema.safeParse({ name: "D", email: "nope", password: "longenough" }).success).toBe(false);
  });
  it("rejects passwords over bcrypt's 72-byte limit", () => {
    expect(signupSchema.safeParse({ name: "D", email: "d@example.com", password: "é".repeat(37) }).success).toBe(false);
    expect(signupSchema.safeParse({ name: "D", email: "d@example.com", password: "a".repeat(72) }).success).toBe(true);
  });
});
