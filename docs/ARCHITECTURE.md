# Architecture note

## Priorities

The brief asks for depth in a few areas over breadth. I put the depth into three places:

1. **Formatting that round-trips exactly.** Content is stored as TipTap (ProseMirror) JSON, not HTML. What you save is
   exactly what reopens, and the stored format can only contain node types the editor knows.
2. **One permission model, enforced on the server.** `src/lib/access.ts` maps roles to actions
   (owner: read/edit/rename/share/delete; editor: read/edit/rename; viewer: read). Every route loads documents through
   `loadDocumentForUser(userId, docId, action)`, so there's no route that can forget a check. Users without access get
   404 rather than 403, so private documents don't reveal that they exist.
3. **A save flow you can trust.** Autosave is debounced and serialized: edits made during a save are queued and sent
   after it; a failed save keeps its changes and shows Retry; leaving the page flushes with `keepalive`, and closing the
   tab with unsaved changes warns.

## Stack and why

| Choice | Why |
|---|---|
| Next.js 15 (App Router) | UI and API in one deployable unit; free hosting on Vercel |
| TipTap 2 | Mature ProseMirror wrapper; bold/italic/underline/headings/lists are configuration, not code |
| Postgres + Drizzle + postgres-js | Real relational constraints (FKs, unique share per user) and a free hosted tier (Neon). Drizzle has no binary engine, which keeps serverless deploys simple |
| Seeded users + signed cookie | The brief allows simulated users; real auth would spend time without demonstrating the sharing logic |
| zod | One validation layer at every API boundary |
| Plain CSS on a Geist/design.md basis | A small token set and type roles in one file; no CSS framework to learn or configure. See `docs/DESIGN.md` |

## Data model

```
users            (id, email unique, name, password_hash)
documents        (id, title, content jsonb, owner_id -> users, created_at, updated_at)
document_shares  (id, document_id -> documents, user_id -> users, role viewer|editor, unique(document_id, user_id))
```

Ownership is a column, not a share row, so a document always has exactly one owner and can't lose it.

## Import

`POST /api/import` validates the file (extension, 2 MB cap, non-empty, zip signature for .docx) and converts it to
HTML: plain text is escaped and split into paragraphs, Markdown goes through `marked`, .docx through `mammoth`.
The browser then parses that HTML with the editor's own schema (`generateJSON`) and creates the document. That parse
step is also the sanitizer: anything the editor doesn't support, including scripts and images, is dropped before
anything is stored.

## Testing

- `tests/access.test.ts`: the full role × action matrix, plus edge cases.
- `tests/import.test.ts`: the real import pipeline in jsdom — Markdown headings/lists/marks, a generated .docx with a
  heading and bold run, HTML injection in .txt and .md, and size/type rejections.
- Manually verified every authorization path with curl and the main flow in a headless browser.

## Trade-offs and what's deprioritized

- **Last write wins.** Two editors saving at once overwrite each other. Acceptable for this scope; see next steps.
- **No real-time collaboration, comments, version history, signup, link sharing or export.**
- **Import always creates a new document** rather than merging into an existing one.

## Next 2–4 hours

1. Optimistic concurrency (send `updatedAt`, 409 on stale writes) — cheap and removes silent overwrites.
2. Version snapshots on save with a simple restore.
3. Link sharing (unguessable token, view-only).
4. Then, if collaboration matters: Yjs + a websocket provider for live co-editing.
