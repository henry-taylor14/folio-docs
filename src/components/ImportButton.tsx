"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { generateJSON } from "@tiptap/html";
import { editorExtensions } from "@/lib/editor-extensions";
import { api, createDocument } from "@/lib/client";
import type { DocContent } from "@/lib/content";

const ACCEPT = ".txt,.md,.markdown,.docx";
const MAX_BYTES = 2 * 1024 * 1024;

export default function ImportButton() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File) {
    setError(null);
    if (file.size > MAX_BYTES) {
      setError("File is larger than 2 MB.");
      return;
    }
    setPending(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const { title, html } = await api<{ title: string; html: string }>("/api/import", { method: "POST", body: form });
      // Parse against the editor schema: unsupported markup is dropped here.
      const content = generateJSON(html, editorExtensions) as DocContent;
      const id = await createDocument({ title, content });
      router.push(`/documents/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
      setPending(false);
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <div className="upload">
        <label className="btn" aria-disabled={pending}>
          {pending ? "Importing…" : "Import file"}
          <input
            ref={inputRef}
            className="visually-hidden"
            type="file"
            accept={ACCEPT}
            disabled={pending}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
            }}
          />
        </label>
        <span className="hint">.txt, .md or .docx, up to 2 MB. Creates a new document.</span>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  );
}
