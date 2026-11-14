# CLAUDE.md — Folio (take-home: lightweight Google Docs)

Read this first. The original brief is in `docs/ASSIGNMENT.md`; every decision here traces back to it.

## What this is
A small full-stack document editor: create/rename/edit rich-text docs, import .txt/.md/.docx as new docs,
share with other users as viewer or editor, persisted in Postgres. Reviewers must be able to test it on a
live URL with seeded accounts, for free.

## Stack
- Next.js 15 (App Router, route handlers) + React 19 + TypeScript
- TipTap 2 (ProseMirror) editor; content stored as TipTap JSON in a `jsonb` column
- Postgres via Drizzle ORM + postgres-js (no binary engines; serverless-friendly)
- Auth: seeded users, bcryptjs, HS256 JWT in an httpOnly cookie (jose)
- zod at every API boundary; Vitest for tests
- Target deploy: Vercel + Neon (both free tiers)

## Commands
```bash
cp .env.example .env          # then set SESSION_SECRET (openssl rand -base64 48)
docker compose up -d          # local Postgres 16 on :5432 (or point DATABASE_URL anywhere)
npm install
npm run db:setup              # drizzle-kit push + idempotent seed
npm run dev                   # http://localhost:3000
npm test                      # vitest (unit + import pipeline)
npm run typecheck
npm run build
```
`db:push`/`db:seed` load `.env` themselves (Node >= 20.12 `process.loadEnvFile`).

## Layout
```
src/db/schema.ts            users, documents, document_shares (+ share_role enum)
src/db/index.ts             lazy getDb() — never touch DB at import time (keeps `next build` env-free)
src/lib/access.ts           resolveRole + can(): THE permission model. Pure, unit-tested.
src/lib/documents.ts        loadDocumentForUser(userId, docId, action) — use for every doc read/write
src/lib/api.ts              withUser() route wrapper, HttpError, parseBody(zod)
src/lib/session.ts          createSession / getCurrentUser / requireUser (pages)
src/lib/validation.ts       zod schemas (title, content JSON, share, login)
src/lib/import.ts           file -> HTML (txt escape, marked, mammoth); size/type checks
src/lib/editor-extensions.ts  single source of truth for the document schema
src/app/api/**              REST route handlers (see table below)
src/app/documents/**        dashboard + editor pages (server components)
src/components/**           client components (DocumentEditor, Toolbar, ShareDialog, ImportButton, useAutosave)
scripts/seed.ts             alice/bob/carol @example.com, password demo1234, plus demo docs and shares
tests/                      access.test.ts, import.test.ts (jsdom; runs real generateJSON + real .docx)
```

## API
| Method | Path | Who | Notes |
|---|---|---|---|
| POST | /api/auth/login, /api/auth/logout | anyone | same 401 message for bad email or password |
| GET/POST | /api/documents | signed in | GET returns `{owned, shared}` |
| GET/PATCH/DELETE | /api/documents/:id | read / edit+rename / owner | PATCH `{title?, content?}` |
| GET/POST | /api/documents/:id/shares | read / owner | POST upserts `{email, role}` |
| DELETE | /api/documents/:id/shares/:userId | owner | |
| POST | /api/import | signed in | multipart `file`; returns `{title, html}` |

## Invariants — keep these true
1. **Every document access goes through `loadDocumentForUser(..., action)`.** Never query `documents` by id in a route without it.
2. **No access => 404, readable but not permitted => 403.** Don't leak existence of private docs.
3. **Only schema-valid TipTap JSON is stored.** Import returns HTML; the browser parses it with
   `generateJSON(html, editorExtensions)` which drops unsupported markup (this is the sanitization step).
   If you add an extension, add it to `editor-extensions.ts` only.
4. Validate request bodies with zod via `parseBody`; user-facing error strings say what happened and how to fix it.
5. Route params are Promises in Next 15 (`const { id } = await params`).
6. Don't add paid services or anything a reviewer must sign up for.

## Status (verified locally against Postgres 16)
Done and verified:
- [x] Create, rename (inline title), edit, autosave (debounced, serialized, retry on failure, keepalive flush on navigate, beforeunload guard), reopen
- [x] Formatting: bold, italic, underline, strike, H1–H3, bulleted/numbered lists, quote, undo/redo; persists across reload
- [x] Import .txt/.md/.docx -> new document (2 MB cap, extension + zip-signature checks, empty-file checks)
- [x] Sharing: owner shares by email as viewer/editor, change role, remove; dashboard splits "My documents" / "Shared with me" with owner + role badge; viewers get a read-only editor
- [x] Validation and error states (401/403/404/400/413/422/500 JSON errors, inline UI errors)
- [x] 29 unit tests pass (`npm test`); typecheck and `next build` pass
- [x] Manual verification: curl smoke test of every authz path; headless-browser run of login -> create -> format -> reload -> share as viewer -> import .md -> viewer sees read-only (that script is NOT committed — see task 2)

## Remaining work, in priority order
1. **Deploy** (needs the human's Neon + Vercel accounts):
   create Neon project -> copy pooled connection string -> `DATABASE_URL=... npm run db:setup` from local ->
   import repo in Vercel -> set `DATABASE_URL` and `SESSION_SECRET` env vars -> deploy -> smoke test with two browsers
   (alice in one, bob in a private window). Put the URL in README.md and SUBMISSION.md.
2. **Commit an end-to-end test.** Playwright (`@playwright/test`) spec: sign in as Alice -> new doc -> type + bold + list
   -> wait for "All changes saved" -> reload and assert formatting -> share with carol as viewer -> sign in as Carol ->
   doc appears under "Shared with me" and editor is `contenteditable=false`. Needs a test DB; run seed first.
   Add `npm run test:e2e`. Keep `npm test` fast and DB-free.
3. **Docs**: finish README (live URL), review `docs/ARCHITECTURE.md`, fill `SUBMISSION.md`, put the video link in
   `VIDEO_URL.txt`. `docs/AI_WORKFLOW.md` must be written by the human from their real experience — draft prompts only.
4. **Small polish, only if time remains:**
   - Delete a document from the UI (API exists; add a confirm in the editor header for owners)
   - Optimistic concurrency: send `updatedAt` with PATCH, return 409 if stale, show "This document changed elsewhere — reload"
   - Basic login rate limiting
5. **Do not build** (deliberately out of scope, list them in the video): real-time co-editing, comments, version
   history, signup/OAuth, link sharing, export, attachments.

## Known limitations (document, don't necessarily fix)
- Last write wins if two editors save the same doc concurrently.
- Sharing by email reveals whether that email has an account (acceptable with seeded users only).
- Import creates a new document; it doesn't merge into an existing one. Images in .docx are dropped (no image node).
- No ESLint config yet; `npm run typecheck` is the static check.
