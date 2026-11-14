/**
 * Idempotent seed: three demo users plus a few documents that demonstrate
 * owned vs. shared (editor and viewer) access. Safe to run repeatedly.
 *   npm run db:seed
 */
import bcrypt from "bcryptjs";
import { eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/db/schema";
import type { DocContent } from "../src/lib/content";

const PASSWORD = "demo1234";
const USERS = [
  { email: "alice@example.com", name: "Alice" },
  { email: "bob@example.com", name: "Bob" },
  { email: "carol@example.com", name: "Carol" },
];

const p = (text: string) => ({ type: "paragraph", content: [{ type: "text", text }] });

const welcome: DocContent = {
  type: "doc",
  content: [
    { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Project kickoff notes" }] },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "This document is owned by Alice and shared with " },
        { type: "text", text: "Bob as an editor", marks: [{ type: "bold" }] },
        { type: "text", text: " and " },
        { type: "text", text: "Carol as a viewer", marks: [{ type: "italic" }] },
        { type: "text", text: "." },
      ],
    },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Goals" }] },
    {
      type: "bulletList",
      content: [
        { type: "listItem", content: [p("Ship a usable editor")] },
        { type: "listItem", content: [p("Support sharing between users")] },
      ],
    },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Next steps" }] },
    {
      type: "orderedList",
      content: [
        { type: "listItem", content: [p("Review the draft")] },
        { type: "listItem", content: [p("Collect feedback")] },
      ],
    },
  ],
};

async function main() {
  try {
    process.loadEnvFile(".env");
  } catch {}
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set.");
  const client = postgres(url, { max: 1, prepare: false });
  const db = drizzle(client, { schema });

  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  await db
    .insert(schema.users)
    .values(USERS.map((u) => ({ ...u, passwordHash })))
    .onConflictDoNothing({ target: schema.users.email });

  const rows = await db
    .select()
    .from(schema.users)
    .where(
      inArray(
        schema.users.email,
        USERS.map((u) => u.email),
      ),
    );
  const byEmail = Object.fromEntries(rows.map((u) => [u.email, u]));
  const alice = byEmail["alice@example.com"];
  const bob = byEmail["bob@example.com"];
  const carol = byEmail["carol@example.com"];

  const existing = await db
    .select({ id: schema.documents.id })
    .from(schema.documents)
    .where(eq(schema.documents.ownerId, alice.id))
    .limit(1);
  if (existing.length === 0) {
    const [kickoff] = await db
      .insert(schema.documents)
      .values({ title: "Project kickoff notes", content: welcome, ownerId: alice.id })
      .returning();
    await db.insert(schema.documentShares).values([
      { documentId: kickoff.id, userId: bob.id, role: "editor" },
      { documentId: kickoff.id, userId: carol.id, role: "viewer" },
    ]);

    await db.insert(schema.documents).values({
      title: "Alice's private draft",
      content: { type: "doc", content: [p("Only Alice can see this one.")] },
      ownerId: alice.id,
    });

    const [bobDoc] = await db
      .insert(schema.documents)
      .values({
        title: "Bob's meeting agenda",
        content: { type: "doc", content: [p("Owned by Bob, shared with Alice as a viewer.")] },
        ownerId: bob.id,
      })
      .returning();
    await db.insert(schema.documentShares).values({ documentId: bobDoc.id, userId: alice.id, role: "viewer" });
    console.log("Seeded users and documents.");
  } else {
    console.log("Users ensured; documents already seeded.");
  }
  console.log(`Demo password for all accounts: ${PASSWORD}`);
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
