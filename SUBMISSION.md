# Submission contents

- **Live app:** https://folio-docs-nine.vercel.app
- **Demo accounts:** alice@example.com, bob@example.com, carol@example.com; password `demo1234` (one-click buttons on the login page). You can also sign up for a new account.
- **Walkthrough video:** URL in `VIDEO_URL.txt`
- **Source repository:** https://github.com/henry-taylor14/folio-docs

## What's in this folder

| Item | Location |
|---|---|
| Source code | `src/`, `scripts/`, `tests/`, plus config files at the root (`package.json`, `tsconfig.json`, `drizzle.config.ts`, `docker-compose.yml`, `.env.example`, ...) |
| Setup and run instructions | `README.md` |
| Architecture note | `docs/ARCHITECTURE.md` |
| AI workflow note | `docs/AI_WORKFLOW.md` |
| This file | `SUBMISSION.md` |
| Walkthrough video link | `VIDEO_URL.txt` |
| Screenshots | `docs/screenshots/` (login, dashboard, editor, share dialog, mobile dark mode) |
| Original brief and design notes | `docs/ASSIGNMENT.md`, `docs/DESIGN.md` |

Not included: `node_modules/`, build output, and `.env` (secrets). Run `npm install` and copy `.env.example` as described in the README.

## Status

**Working end to end** (on the live URL and locally):
- Sign in with seeded accounts or sign up; sign out
- Create, rename, edit documents with autosave (retry on failure, flush on navigate)
- Formatting: bold, italic, underline, strikethrough, H1 to H3, bulleted and numbered lists, quotes, undo/redo; persists across reload
- Import .txt, .md, .docx (up to 2 MB) as a new document
- Share by email as viewer or editor, change role, remove access; viewers get a read-only editor
- Delete to "Recently deleted" with restore (30 days); make a copy
- Server-side permission checks on every route; validation and error states
- 35 automated unit tests (`npm test`): permission matrix, import pipeline with a real .docx, signup validation

**Incomplete or deliberately not built:**
- No committed end-to-end browser test (the main flow was verified manually and with a local headless-browser script)
- Last write wins if two editors save the same document at the same time
- Text size varies through heading levels only (H1 to H3); there is no font-size picker
- Not built: real-time co-editing, comments, version history, OAuth, password reset, email verification, link sharing, export, attachments

**Next 2 to 4 hours:** see "Next 2–4 hours" in `docs/ARCHITECTURE.md`.
