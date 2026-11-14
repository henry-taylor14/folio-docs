# AI workflow note

## Tools used

- Worked with **Claude Chat** to produce the first version
  (schema, auth, route handlers, TipTap editor, share dialog, import pipeline, unit tests) and the Vercel design.md restyle.
- **Claude Code in VS Code**: everything after the scaffold, across three sessions: local setup, soft delete, make a copy, Neon + Vercel deploy, signup, and submission docs.
- **Neon CLI + Neon agent skills**: provisioned the database and wrote connection strings to `.env`.
- **CLAUDE.md as the project contract**: stack, invariants (every doc access through `loadDocumentForUser`, 404/403/410 rules, only schema-valid TipTap JSON stored), and a prioritized task list. Each session started from it, and I kept it updated so the next session didn't re-derive decisions.

## Where AI materially sped things up

- **Scaffold in one pass**: a working full-stack app with a tested permission model in 20 minutes, instead of a day of wiring.
- **Environment problems handled without me**: no Docker on my machine, so it installed Postgres 16 with Homebrew, created the DB user, seeded, and started the dev server. It also diagnosed a corrupted `.next` dev cache as a Next hot-reload glitch rather than a code bug.
- **Feature work end to end**: soft delete (owner only, 30-day "Recently deleted", greyed rows for collaborators, 410 for deleted docs), make a copy, and signup each took one prompt plus review, including API route, UI, validation, tests and a curl check of the permission paths.
- **Deploy**: it walked me through Neon and Vercel, ran the schema push and seed against Neon, and smoke tested the live site (sign-in, 404 for private docs, viewer gets 403 on save, editor can save, 401 when signed out).

## What I changed or rejected

- **Scope.** Signup was originally listed as out of scope (seeded users only). I decided reviewers should be able to create their own account and had it added, with an 8 to 72 byte password rule because bcrypt ignores bytes past 72.
- **Neon CLI side effects.** `neon deploy` wrote to `.env` instead of `.env.local`, which pointed my local dev server at the production database. I kept that knowingly, and the one code change was making `drizzle.config.ts` use the direct (unpooled) URL for schema pushes, as the Neon guidance requires.
- **Secrets.** I told it never to print connection strings in chat. Before making the repo public it scanned tracked files and history for secrets; before each commit it scanned staged changes.
- **Final review caught gaps.** A last review pass found the README and architecture note still said signup wasn't built, and warned that uploading the working folder to Drive would leak `.env` (live DB URL and session secret). The submission is packaged from `git archive` instead.

## How I verified correctness, UX and reliability

- **Automated tests** (`npm test`, 35 tests, no DB needed): full role × action permission matrix, the real import pipeline in jsdom (Markdown, a generated .docx, HTML injection in .txt/.md, size and type rejections), and signup validation. Typecheck and `next build` run before every commit.
- **Authorization by curl** against local and live servers: owner/editor/viewer/stranger for read, edit, share, delete, restore and copy. Private docs return 404 so they don't leak existence.
- **Time-based behavior**: the 30-day purge was checked by backdating a deletion (still there at 29 days, gone at 31).
- **Not trusting a failing check blindly**: one live smoke test returned 400 on an editor save; it turned out to be the shell stripping quotes from the test's JSON, not an app bug. Retested with valid JSON.
- **Browser checks by me**: Alice in one window and Bob/Carol in a private window, editing, sharing, reload keeps formatting, viewer is read-only, light/dark.
- **Known gaps**: no committed end-to-end browser test; last write wins on concurrent saves; text size varies through headings only (no font-size picker).
