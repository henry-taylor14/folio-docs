# Design system

Folio's styling is based on Vercel's [design.md](https://vercel.com/design.md)
([background](https://vercel.com/blog/how-our-agents-build-on-brand-pages-with-design-md)),
adapted from Vercel-authored report pages to a document-editing app.

## What we adopted

- **Geist** for everything (via the `geist` npm package, so builds need no network). Geist Mono only for code and
  identifiers, never whole sentences or tables.
- **Monochrome.** Color appears only for state: blue focus ring, red errors. Errors also carry a text cue
  ("Error: …"), so meaning never depends on color alone.
- **One continuous canvas.** No cards, panels, paper effects or decorative shadows. Borders only where they separate
  something real: table rows, inputs, the sticky editor bar, list rows in the share dialog. The modal is the one
  raised surface because it sits above the page.
- **Type roles, not ad hoc sizes.** `.t-title` 32/40, `.t-heading-24`, `.t-heading-20`, `.t-heading-16`, body 16/24,
  label 14/20, caption 13/18. Headings are semibold with tight tracking. Document text is 16/28 in a column of about
  68 characters.
- **Spacing scale** `--space-1` … `--space-16` (4–64px). Within a group 8–16px; between groups 24–32px; between
  sections 48px.
- **Tables for lists of documents.** Semantic `<table>`, full width, header alignment matches its cells, baseline
  alignment, tabular numerals for times.
- **No pills or badges for metadata.** Access level is plain text ("Can view").
- **Sentence case, plain verbs, no em dashes** in UI copy. Buttons name the action ("Share", "Import file").
- **Light and dark follow the OS**; there is no theme switcher.
- **Stillness.** No entrance animations; reduced motion respected.

## What we did not adopt, and why

- The **Vercel wordmark/triangle header and footer** and the hosted **`vercel-brand.css` (`vbg-*`) stylesheet**:
  they exist to mark a page as authored by Vercel, which this app isn't. Tokens live in `src/app/globals.css` under
  our own names instead.
- Report-specific guidance (executive and audit reading paths, stat strips, chart rules) has no counterpart in an
  editor and isn't used.

## Rules for new UI

1. Use existing tokens and type roles in `globals.css`; don't add new font sizes, weights or colors.
2. Reach for spacing and typography before a border; reach for a border before a surface.
3. New colors only for state, always paired with text.
4. Check light and dark, and 390px wide, before calling it done.
