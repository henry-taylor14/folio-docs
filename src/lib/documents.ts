import "server-only";
import { and, desc, eq, isNotNull, isNull, lt } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { can, resolveRole, TRASH_DAYS, type Action, type Role } from "./access";
import { HttpError } from "./api";
import { idSchema } from "./validation";
import type { DocContent } from "./content";

const { documents, documentShares, users } = schema;

const trashCutoff = () => new Date(Date.now() - TRASH_DAYS * 24 * 60 * 60 * 1000);

/**
 * Hard-delete documents that have been in Recently deleted for over TRASH_DAYS.
 * Shares cascade, so the greyed-out rows on collaborators' dashboards go too.
 * ponytail: runs lazily on every document load/list (one indexed DELETE); swap for a Vercel cron if traffic grows.
 */
async function purgeExpired() {
  await getDb().delete(documents).where(lt(documents.deletedAt, trashCutoff()));
}

export type DocumentSummary = {
  id: string;
  title: string;
  updatedAt: Date;
  ownerName: string;
  role: Role;
  deletedAt: Date | null;
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
 * existence; a readable doc the user can't modify returns 403. A doc in
 * Recently deleted returns 410 for everything except the owner's "restore".
 */
export async function loadDocumentForUser(userId: string, docId: string, action: Action): Promise<LoadedDocument> {
  if (!idSchema.safeParse(docId).success) throw new HttpError(404, "Document not found.");
  await purgeExpired();
  const db = getDb();
  const [row] = await db
    .select({
      id: documents.id,
      title: documents.title,
      content: documents.content,
      ownerId: documents.ownerId,
      ownerName: users.name,
      updatedAt: documents.updatedAt,
      deletedAt: documents.deletedAt,
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
  // Deleted check comes after the read check so outsiders still get a plain 404.
  if (row.deletedAt && action !== "restore") {
    throw new HttpError(
      410,
      role === "owner"
        ? "This document is in Recently deleted. Restore it from your documents list to open it."
        : `${row.ownerName} deleted this document.`,
    );
  }
  if (!row.deletedAt && action === "restore") throw new HttpError(409, "This document isn't deleted.");
  if (!can(role, action)) throw new HttpError(403, "You don't have permission to do that.");
  return { ...row, role: role! };
}

export async function listDocumentsForUser(
  userId: string,
): Promise<{ owned: DocumentSummary[]; deleted: DocumentSummary[]; shared: DocumentSummary[] }> {
  await purgeExpired();
  const db = getDb();
  const ownedCols = {
    id: documents.id,
    title: documents.title,
    updatedAt: documents.updatedAt,
    ownerName: users.name,
    deletedAt: documents.deletedAt,
  };
  const owned = await db
    .select(ownedCols)
    .from(documents)
    .innerJoin(users, eq(users.id, documents.ownerId))
    .where(and(eq(documents.ownerId, userId), isNull(documents.deletedAt)))
    .orderBy(desc(documents.updatedAt));

  const deleted = await db
    .select(ownedCols)
    .from(documents)
    .innerJoin(users, eq(users.id, documents.ownerId))
    .where(and(eq(documents.ownerId, userId), isNotNull(documents.deletedAt)))
    .orderBy(desc(documents.deletedAt));

  const shared = await db
    .select({
      id: documents.id,
      title: documents.title,
      updatedAt: documents.updatedAt,
      ownerName: users.name,
      role: documentShares.role,
      deletedAt: documents.deletedAt,
    })
    .from(documentShares)
    .innerJoin(documents, eq(documents.id, documentShares.documentId))
    .innerJoin(users, eq(users.id, documents.ownerId))
    .where(eq(documentShares.userId, userId))
    .orderBy(desc(documents.updatedAt));

  return {
    owned: owned.map((d) => ({ ...d, role: "owner" as const })),
    deleted: deleted.map((d) => ({ ...d, role: "owner" as const })),
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
