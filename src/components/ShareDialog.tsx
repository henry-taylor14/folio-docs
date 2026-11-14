"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, jsonInit } from "@/lib/client";

type Share = { userId: string; email: string; name: string; role: "viewer" | "editor" };

export default function ShareDialog({ docId, open, onClose }: { docId: string; open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [shares, setShares] = useState<Share[] | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"viewer" | "editor">("editor");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api<{ shares: Share[] }>(`/api/documents/${docId}/shares`);
      setShares(data.shares);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load sharing settings.");
    }
  }, [docId]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      setError(null);
      void load();
    } else if (!open && d.open) d.close();
  }, [open, load]);

  async function mutate(fn: () => Promise<{ shares: Share[] }>) {
    setPending(true);
    setError(null);
    try {
      setShares((await fn()).shares);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      return false;
    } finally {
      setPending(false);
    }
  }

  return (
    <dialog ref={ref} className="dialog" onClose={onClose} aria-labelledby="share-title">
      <h2 id="share-title">Share document</h2>
      <form
        className="share-form"
        onSubmit={async (e) => {
          e.preventDefault();
          const ok = await mutate(() => api(`/api/documents/${docId}/shares`, jsonInit("POST", { email, role })));
          if (ok) setEmail("");
        }}
      >
        <label className="visually-hidden" htmlFor="share-email">Email</label>
        <input id="share-email" className="input" type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label className="visually-hidden" htmlFor="share-role">Access</label>
        <select id="share-role" className="select" value={role} onChange={(e) => setRole(e.target.value as Share["role"])}>
          <option value="editor">Can edit</option>
          <option value="viewer">Can view</option>
        </select>
        <button className="btn btn-primary" type="submit" disabled={pending || !email}>Share</button>
      </form>
      {error && <p className="error" role="alert">{error}</p>}

      <ul className="share-list" aria-label="People with access">
        {shares === null && !error && <li className="hint">Loading…</li>}
        {shares?.length === 0 && <li className="hint">Only you can open this document.</li>}
        {shares?.map((s) => (
          <li key={s.userId}>
            <div className="share-who">
              <strong>{s.name}</strong>
              <span>{s.email}</span>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <select
                className="select"
                aria-label={`Access for ${s.name}`}
                value={s.role}
                disabled={pending}
                onChange={(e) => mutate(() => api(`/api/documents/${docId}/shares`, jsonInit("POST", { email: s.email, role: e.target.value })))}
              >
                <option value="editor">Can edit</option>
                <option value="viewer">Can view</option>
              </select>
              <button
                className="btn btn-quiet btn-danger"
                disabled={pending}
                onClick={() => mutate(() => api(`/api/documents/${docId}/shares/${s.userId}`, { method: "DELETE" }))}
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div className="dialog-foot">
        <button className="btn" onClick={onClose}>Done</button>
      </div>
    </dialog>
  );
}
