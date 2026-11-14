import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { HttpError, parseBody, withUser } from "@/lib/api";
import { listShares, loadDocumentForUser } from "@/lib/documents";
import { shareSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

// Anyone who can read the doc can see who it's shared with.
export const GET = withUser<Ctx>(async (_req, { params }, user) => {
  const { id } = await params;
  await loadDocumentForUser(user.id, id, "read");
  return NextResponse.json({ shares: await listShares(id) });
});

// Owner only. Re-sharing with an existing user updates their role.
export const POST = withUser<Ctx>(async (req, { params }, user) => {
  const { id } = await params;
  const doc = await loadDocumentForUser(user.id, id, "share");
  const { email, role } = await parseBody(req, shareSchema);

  const [target] = await getDb()
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);
  if (!target) throw new HttpError(404, `No user with the email ${email}.`);
  if (target.id === doc.ownerId) throw new HttpError(400, "You already own this document.");

  await getDb()
    .insert(schema.documentShares)
    .values({ documentId: id, userId: target.id, role })
    .onConflictDoUpdate({
      target: [schema.documentShares.documentId, schema.documentShares.userId],
      set: { role },
    });
  return NextResponse.json({ shares: await listShares(id) });
});
