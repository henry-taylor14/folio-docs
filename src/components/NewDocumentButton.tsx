"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createDocument } from "@/lib/client";

export default function NewDocumentButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        className="btn btn-primary"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError(null);
          try {
            const id = await createDocument({});
            router.push(`/documents/${id}`);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Couldn't create the document.");
            setPending(false);
          }
        }}
      >
        {pending ? "Creating…" : "New document"}
      </button>
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  );
}
