import { NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import { parseBody, withUser } from "@/lib/api";
import { EMPTY_DOC } from "@/lib/content";
import { listDocumentsForUser } from "@/lib/documents";
import { createDocumentSchema } from "@/lib/validation";

export const GET = withUser(async (_req, _ctx, user) => {
  return NextResponse.json(await listDocumentsForUser(user.id));
});

export const POST = withUser(async (req, _ctx, user) => {
  const body = await parseBody(req, createDocumentSchema);
  const [doc] = await getDb()
    .insert(schema.documents)
    .values({
      title: body.title ?? "Untitled document",
      content: body.content ?? EMPTY_DOC,
      ownerId: user.id,
    })
    .returning({ id: schema.documents.id });
  return NextResponse.json({ id: doc.id }, { status: 201 });
});
