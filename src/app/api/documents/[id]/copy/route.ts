import { NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import { withUser } from "@/lib/api";
import { loadDocumentForUser } from "@/lib/documents";
import { TITLE_MAX } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

/** Anyone who can read a document can copy it; the copy is theirs, with no shares. */
export const POST = withUser<Ctx>(async (_req, { params }, user) => {
  const { id } = await params;
  const source = await loadDocumentForUser(user.id, id, "read");
  const [doc] = await getDb()
    .insert(schema.documents)
    .values({
      title: `Copy of ${source.title}`.slice(0, TITLE_MAX),
      content: source.content,
      ownerId: user.id,
    })
    .returning({ id: schema.documents.id });
  return NextResponse.json({ id: doc.id }, { status: 201 });
});
