import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { parseBody, withUser } from "@/lib/api";
import { loadDocumentForUser } from "@/lib/documents";
import { updateDocumentSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withUser<Ctx>(async (_req, { params }, user) => {
  const { id } = await params;
  const doc = await loadDocumentForUser(user.id, id, "read");
  return NextResponse.json({ document: doc });
});

export const PATCH = withUser<Ctx>(async (req, { params }, user) => {
  const { id } = await params;
  const body = await parseBody(req, updateDocumentSchema);
  if (body.title !== undefined) await loadDocumentForUser(user.id, id, "rename");
  if (body.content !== undefined) await loadDocumentForUser(user.id, id, "edit");

  const [updated] = await getDb()
    .update(schema.documents)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(schema.documents.id, id))
    .returning({ title: schema.documents.title, updatedAt: schema.documents.updatedAt });
  return NextResponse.json(updated);
});

export const DELETE = withUser<Ctx>(async (_req, { params }, user) => {
  const { id } = await params;
  await loadDocumentForUser(user.id, id, "delete");
  // Soft delete: moves to the owner's Recently deleted list; purged after TRASH_DAYS.
  await getDb().update(schema.documents).set({ deletedAt: new Date() }).where(eq(schema.documents.id, id));
  return new NextResponse(null, { status: 204 });
});
