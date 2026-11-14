import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { HttpError, withUser } from "@/lib/api";
import { listShares, loadDocumentForUser } from "@/lib/documents";
import { idSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string; userId: string }> };

export const DELETE = withUser<Ctx>(async (_req, { params }, user) => {
  const { id, userId } = await params;
  await loadDocumentForUser(user.id, id, "share");
  if (!idSchema.safeParse(userId).success) throw new HttpError(404, "Share not found.");
  await getDb()
    .delete(schema.documentShares)
    .where(and(eq(schema.documentShares.documentId, id), eq(schema.documentShares.userId, userId)));
  return NextResponse.json({ shares: await listShares(id) });
});
