# AI workflow note

> TODO (write this yourself, from what actually happened). Keep it short and specific. Prompts to answer:

## Tools used
- e.g. Claude (claude.ai) for planning and the initial scaffold; Claude Code for … ; other tools …

## Where AI materially sped things up
- e.g. Initial scaffold: schema, auth, route handlers, editor, share dialog, tests, in one pass.
- …

## What I changed or rejected
- Concrete examples: a suggestion you overrode and why; a bug you found in generated code; a design choice you reversed.

## How I verified correctness, UX and reliability
- Unit tests (role × action matrix; import pipeline with a real .docx)
- Manual authz checks with two browsers / curl (viewer can't edit, non-shared user gets 404, non-owner can't share)
- Reload checks for formatting persistence; failure-state checks (stop the DB, watch autosave show Retry)
- …
