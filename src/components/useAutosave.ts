"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, jsonInit } from "@/lib/client";
import type { DocContent } from "@/lib/content";

export type SaveStatus = "saved" | "dirty" | "saving" | "error";
type Patch = { title?: string; content?: DocContent };

const DEBOUNCE_MS = 800;

/**
 * Debounced, serialized autosave. Edits made while a save is in flight are
 * queued and sent after it finishes; a failed save keeps its changes queued
 * so retry() resends them. Last write wins on the server (no conflict detection yet).
 */
export function useAutosave(docId: string) {
  const pending = useRef<Patch>({});
  const inFlight = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [status, setStatus] = useState<SaveStatus>("saved");
  const [error, setError] = useState<string | null>(null);

  const hasPending = () => pending.current.title !== undefined || pending.current.content !== undefined;

  const flush = useCallback(async () => {
    clearTimeout(timer.current);
    if (inFlight.current || !hasPending()) return;
    const body = pending.current;
    pending.current = {};
    inFlight.current = true;
    setStatus("saving");
    try {
      await api(`/api/documents/${docId}`, jsonInit("PATCH", body));
      inFlight.current = false;
      setError(null);
      if (hasPending()) void flush();
      else setStatus("saved");
    } catch (err) {
      inFlight.current = false;
      pending.current = { ...body, ...pending.current }; // keep newer edits on top
      setError(err instanceof Error ? err.message : "Save failed.");
      setStatus("error");
    }
  }, [docId]);

  const queue = useCallback(
    (patch: Patch) => {
      pending.current = { ...pending.current, ...patch };
      setStatus((s) => (s === "saving" ? s : "dirty"));
      clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), DEBOUNCE_MS);
    },
    [flush],
  );

  // Warn before closing the tab with unsaved changes.
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasPending() || inFlight.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  // Navigating away inside the app: send whatever is left with keepalive.
  useEffect(() => {
    return () => {
      clearTimeout(timer.current);
      if (hasPending()) {
        void fetch(`/api/documents/${docId}`, { ...jsonInit("PATCH", pending.current), keepalive: true });
      }
    };
  }, [docId]);

  return { status, error, queue, retry: flush };
}
