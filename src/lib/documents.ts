import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { can, resolveRole, type Action, type Role } from "./access";
import { HttpError } from "./api";
import { idSchema } from "./validation";
import type { DocContent } from "./content";

const { documents, documentShares, users } = schema;

export type DocumentSummary = {
  id: string;
  title: string;
  updatedAt: Date;
  ownerName: string;
  role: Role;
};

export type LoadedDocument = {
  id: string;
  title: string;
  content: DocContent;
  ownerId: string;
  ownerName: string;
  updatedAt: Date;
  role: Role;
};

/**
 * Load a document and the caller's role, enforcing `action`.
 * Missing docs and docs the user can't read both return 404 so we don't leak
 * existence; a readable doc the user can't modify returns 403.
 */
export async function loadDocumentForUser(userId: string, docId: string, action: Action): Promise<LoadedDocument> {
  if (!idSchema.safeParse(docId).success) throw new HttpError(404, "Document not found.");
  const db = getDb();
  const [row] = await db
    .select({
      id: documents.id,
      title: documents.title,
      content: documents.content,
      ownerId: documents.ownerId,
      ownerName: users.name,
      updatedAt: documents.updatedAt,
    })
    .from(documents)
    .innerJoin(users, eq(users.id, documents.ownerId))
    .where(eq(documents.id, docId))
    .limit(1);
  if (!row) throw new HttpError(404, "Document not found.");

  const shares = await db
    .select({ userId: documentShares.userId, role: documentShares.role })
    .from(documentShares)
    .where(and(eq(documentShares.documentId, docId), eq(documentShares.userId, userId)));

  const role = resolveRole(userId, row, shares);
  if (!can(role, "read")) throw new HttpError(404, "Document not found.");
  if (!can(role, action)) throw new HttpError(403, "You don't have permission to do that.");
  return { ...row, role: role! };
}

export async function listDocumentsForUser(
  userId: string,
): Promise<{ owned: DocumentSummary[]; shared: DocumentSummary[] }> {
  const db = getDb();
  const owned = await db
    .select({ id: documents.id, title: documents.title, updatedAt: documents.updatedAt, ownerName: users.name })
    .from(documents)
    .innerJoin(users, eq(users.id, documents.ownerId))
    .where(eq(documents.ownerId, userId))
    .orderBy(desc(documents.updatedAt));

  const shared = await db
    .select({
      id: documents.id,
      title: documents.title,
      updatedAt: documents.updatedAt,
      ownerName: users.name,
      role: documentShares.role,
    })
    .from(documentShares)
    .innerJoin(documents, eq(documents.id, documentShares.documentId))
    .innerJoin(users, eq(users.id, documents.ownerId))
    .where(eq(documentShares.userId, userId))
    .orderBy(desc(documents.updatedAt));

  return {
    owned: owned.map((d) => ({ ...d, role: "owner" as const })),
    shared,
  };
}

export async function listShares(docId: string) {
  return getDb()
    .select({ userId: users.id, email: users.email, name: users.name, role: documentShares.role })
    .from(documentShares)
    .innerJoin(users, eq(users.id, documentShares.userId))
    .where(eq(documentShares.documentId, docId))
    .orderBy(users.name);
}
