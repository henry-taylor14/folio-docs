import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb, schema } from "@/db";
import { HttpError, jsonError, parseBody } from "@/lib/api";
import { createSession } from "@/lib/session";
import { signupSchema } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await parseBody(req, signupSchema);
    const passwordHash = await bcrypt.hash(password, 10);
    // The unique index on email decides races; no row back means the email is taken.
    const [user] = await getDb()
      .insert(schema.users)
      .values({ name, email, passwordHash })
      .onConflictDoNothing({ target: schema.users.email })
      .returning({ id: schema.users.id, email: schema.users.email, name: schema.users.name });
    // ponytail: reveals that the email is registered, same tradeoff as share-by-email.
    if (!user) return jsonError(409, "An account with this email already exists. Sign in instead.");
    await createSession(user.id);
    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    if (err instanceof HttpError) return jsonError(err.status, err.message);
    console.error(err);
    return jsonError(500, "Something went wrong on the server.");
  }
}
