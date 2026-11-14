"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";

/** Shared pending/error handling for a single-request action button. */
function ActionButton({
  label,
  pendingLabel,
  className,
  run,
}: {
  label: string;
  pendingLabel: string;
  className: string;
  run: () => Promise<boolean>;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="trash-action">
      <button
        className={className}
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError(null);
          try {
            if (!(await run())) setPending(false);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong.");
            setPending(false);
          }
        }}
      >
        {pending ? pendingLabel : label}
      </button>
      {error && (
        <span className="error" role="alert">
          Error: {error}
        </span>
      )}
    </span>
  );
}

export function DeleteDocumentButton({ docId, title, days }: { docId: string; title: string; days: number }) {
  const router = useRouter();
  return (
    <ActionButton
      label="Delete"
      pendingLabel="Deleting…"
      className="btn btn-ghost btn-destructive"
      run={async () => {
        const name = title.trim() || "Untitled";
        if (!confirm(`Delete "${name}"? It moves to Recently deleted for ${days} days, then is removed for good.`)) {
          return false;
        }
        await api(`/api/documents/${docId}`, { method: "DELETE" });
        router.push("/documents");
        router.refresh();
        return true;
      }}
    />
  );
}

export function RestoreButton({ docId }: { docId: string }) {
  const router = useRouter();
  return (
    <ActionButton
      label="Restore"
      pendingLabel="Restoring…"
      className="btn btn-ghost"
      run={async () => {
        await api(`/api/documents/${docId}/restore`, { method: "POST" });
        router.refresh();
        return true;
      }}
    />
  );
}
