import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { withUser } from "@/lib/api";
import { loadDocumentForUser } from "@/lib/documents";

type Ctx = { params: Promise<{ id: string }> };

export const POST = withUser<Ctx>(async (_req, { params }, user) => {
  const { id } = await params;
  await loadDocumentForUser(user.id, id, "restore");
  await getDb().update(schema.documents).set({ deletedAt: null }).where(eq(schema.documents.id, id));
  return new NextResponse(null, { status: 204 });
});
