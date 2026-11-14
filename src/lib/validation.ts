import { z } from "zod";
import type { DocNode } from "./content";

export const TITLE_MAX = 200;
/** Serialized JSON size cap for document content (bytes). */
export const CONTENT_MAX_BYTES = 1_000_000;

export const idSchema = z.string().uuid();

export const titleSchema = z
  .string()
  .trim()
  .min(1, "Title can't be empty.")
  .max(TITLE_MAX, `Title must be ${TITLE_MAX} characters or fewer.`);

const nodeSchema: z.ZodType<DocNode> = z.lazy(() =>
  z
    .object({
      type: z.string(),
      attrs: z.record(z.unknown()).optional(),
      content: z.array(nodeSchema).optional(),
      marks: z.array(z.object({ type: z.string(), attrs: z.record(z.unknown()).optional() })).optional(),
      text: z.string().optional(),
    })
    .strict(),
);

export const contentSchema = z
  .object({
    type: z.literal("doc", { errorMap: () => ({ message: "Document content is malformed." }) }),
    content: z.array(nodeSchema).optional(),
  })
  .strict()
  .refine((v) => JSON.stringify(v).length <= CONTENT_MAX_BYTES, "Document is too large to save.");

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  password: z.string().min(1, "Enter your password."),
});

export const signupSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(100, "Name must be 100 characters or fewer."),
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  // bcrypt only uses the first 72 bytes, so cap it rather than silently ignore the rest.
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .refine((p) => new TextEncoder().encode(p).length <= 72, "Password must be 72 bytes or fewer."),
});

export const createDocumentSchema = z.object({
  title: titleSchema.optional(),
  content: contentSchema.optional(),
});

export const updateDocumentSchema = z
  .object({ title: titleSchema.optional(), content: contentSchema.optional() })
  .refine((v) => v.title !== undefined || v.content !== undefined, "Nothing to update.");

export const shareSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  role: z.enum(["viewer", "editor"]),
});
