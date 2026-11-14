# Folio

A small document editor: write and format documents, import files, and share them with other people.

**Live app:** _TODO: add Vercel URL_

## Demo accounts

All passwords are `demo1234`. The login page also has one-click buttons for each.

| Account | Has |
|---|---|
| alice@example.com | Owns "Project kickoff notes" (shared with Bob as editor, Carol as viewer) and a private draft. Can view Bob's agenda. |
| bob@example.com | Owns "Bob's meeting agenda". Can edit Alice's kickoff notes. |
| carol@example.com | Can view Alice's kickoff notes. |

To try sharing, sign in as Alice in one browser and as Bob or Carol in a private window.

## Features

- Create, rename and edit documents; changes save automatically.
- Formatting: bold, italic, underline, strikethrough, headings (H1–H3), bulleted and numbered lists, quotes, undo/redo.
- Import a file as a new document. **Supported: .txt, .md, .docx, up to 2 MB.** Headings, lists and bold/italic carry over; images and other unsupported formatting are dropped.
- Share a document by email as **Can view** or **Can edit**; change or remove access later. The dashboard separates "My documents" from "Shared with me".
- Documents and sharing are stored in Postgres and survive refresh.

## Run locally

Requirements: Node 20.12+, and Docker (or any Postgres 14+).

```bash
cp .env.example .env
# set SESSION_SECRET in .env, e.g. `openssl rand -base64 48`
docker compose up -d        # Postgres on localhost:5432 matching .env.example
npm install
npm run db:setup            # create tables and seed demo data (safe to re-run)
npm run dev                 # http://localhost:3000
```

Other commands:

```bash
npm test            # unit tests (no database needed)
npm run typecheck
npm run build && npm start
```

## Deploy (Vercel + Neon, both free)

1. Create a Neon project and copy its **pooled** connection string.
2. From your machine: `DATABASE_URL="<neon url>" npm run db:setup`.
3. Import this repo in Vercel. Set `DATABASE_URL` and `SESSION_SECRET` in Project Settings → Environment Variables.
4. Deploy.

## Project docs

- [Architecture note](docs/ARCHITECTURE.md)
- [AI workflow note](docs/AI_WORKFLOW.md)
- [Design system](docs/DESIGN.md), based on Vercel's design.md
- [What's included](SUBMISSION.md)
- Screenshots in [docs/screenshots](docs/screenshots)

## Status

Working end to end: everything listed under Features.

Not built (deliberately): real-time co-editing, comments, version history, signup, link sharing, export.
See the architecture note for what I'd build next.
