import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { HttpError, jsonError, parseBody } from "@/lib/api";
import { createSession } from "@/lib/session";
import { loginSchema } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    const { email, password } = await parseBody(req, loginSchema);
    const [user] = await getDb().select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
    // Same message for unknown email and wrong password.
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return jsonError(401, "Email or password is incorrect.");
    }
    await createSession(user.id);
    return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    if (err instanceof HttpError) return jsonError(err.status, err.message);
    console.error(err);
    return jsonError(500, "Something went wrong on the server.");
  }
}
