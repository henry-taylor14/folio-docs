/**
 * File import: turns an uploaded .txt / .md / .docx into HTML.
 * The browser then parses that HTML with the editor's own schema
 * (generateJSON), which drops anything the editor doesn't support —
 * that parse is also our sanitization step, since we only ever store
 * schema-valid TipTap JSON.
 */
import mammoth from "mammoth";
import { marked } from "marked";
import { TITLE_MAX } from "./validation";

export const MAX_IMPORT_BYTES = 2 * 1024 * 1024;

const KINDS = {
  ".txt": "text",
  ".md": "markdown",
  ".markdown": "markdown",
  ".docx": "docx",
} as const;

export type ImportKind = (typeof KINDS)[keyof typeof KINDS];
export const SUPPORTED_EXTENSIONS = Object.keys(KINDS);
export const SUPPORTED_LABEL = ".txt, .md, .docx (up to 2 MB)";

export class ImportError extends Error {}

function extensionOf(filename: string): string {
  const i = filename.lastIndexOf(".");
  return i === -1 ? "" : filename.slice(i).toLowerCase();
}

export function detectKind(filename: string): ImportKind {
  const kind = KINDS[extensionOf(filename) as keyof typeof KINDS];
  if (!kind) throw new ImportError(`Unsupported file type. Supported: ${SUPPORTED_LABEL}.`);
  return kind;
}

export function titleFromFilename(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, "").trim();
  return (base || "Imported document").slice(0, TITLE_MAX);
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function textToHtml(text: string): string {
  const paragraphs = text.replace(/\r\n?/g, "\n").split(/\n{2,}/);
  return paragraphs
    .filter((p) => p.trim() !== "")
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export function markdownToHtml(md: string): string {
  return marked.parse(md, { async: false, gfm: true }) as string;
}

export async function docxToHtml(buffer: Buffer): Promise<string> {
  // .docx is a zip; reject renamed files early with a clear message.
  if (buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
    throw new ImportError("That file isn't a valid .docx document.");
  }
  try {
    const { value } = await mammoth.convertToHtml({ buffer });
    return value;
  } catch {
    throw new ImportError("Couldn't read that .docx file. Try re-saving it from Word or Google Docs.");
  }
}

export async function fileToHtml(filename: string, buffer: Buffer): Promise<{ title: string; html: string }> {
  const kind = detectKind(filename);
  if (buffer.length === 0) throw new ImportError("That file is empty.");
  if (buffer.length > MAX_IMPORT_BYTES) throw new ImportError("File is larger than 2 MB.");

  let html: string;
  if (kind === "docx") {
    html = await docxToHtml(buffer);
  } else {
    const text = buffer.toString("utf8");
    if (text.includes("\u0000")) throw new ImportError("That file doesn't look like plain text.");
    html = kind === "markdown" ? markdownToHtml(text) : textToHtml(text);
  }

  if (html.trim() === "") throw new ImportError("No readable content found in that file.");
  return { title: titleFromFilename(filename), html };
}
