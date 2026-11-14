import "server-only";
import { NextResponse } from "next/server";
import type { z } from "zod";
import { getCurrentUser, type SessionUser } from "./session";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function jsonError(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

export async function parseBody<T extends z.ZodTypeAny>(req: Request, schema: T): Promise<z.infer<T>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new HttpError(400, "Request body must be valid JSON.");
  }
  const result = schema.safeParse(raw);
  if (!result.success) throw new HttpError(400, result.error.issues[0]?.message ?? "Invalid request.");
  return result.data;
}

/**
 * Wrap a route handler: resolves the signed-in user (401 otherwise) and
 * converts thrown HttpErrors / unexpected errors into JSON responses.
 */
export function withUser<Ctx>(handler: (req: Request, ctx: Ctx, user: SessionUser) => Promise<Response>) {
  return async (req: Request, ctx: Ctx): Promise<Response> => {
    try {
      const user = await getCurrentUser();
      if (!user) return jsonError(401, "Sign in to continue.");
      return await handler(req, ctx, user);
    } catch (err) {
      if (err instanceof HttpError) return jsonError(err.status, err.message);
      console.error(err);
      return jsonError(500, "Something went wrong on the server.");
    }
  };
}
