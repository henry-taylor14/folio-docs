/** Small browser-side API helpers. Throw Error(message-from-server) on failure. */
import type { DocContent } from "./content";

export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (res.status === 401) {
    window.location.href = "/login";
    throw new Error("Your session expired. Sign in again.");
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new Error((data as { error?: string } | null)?.error ?? `Request failed (${res.status}).`);
  return data as T;
}

export function jsonInit(method: string, body: unknown): RequestInit {
  return { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

export async function createDocument(input: { title?: string; content?: DocContent }): Promise<string> {
  const { id } = await api<{ id: string }>("/api/documents", jsonInit("POST", input));
  return id;
}
