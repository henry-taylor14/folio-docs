// @vitest-environment jsdom
/**
 * Import pipeline: file -> HTML (server) -> TipTap JSON via the editor schema
 * (browser). jsdom supplies DOMParser so we can run the real generateJSON.
 */
import { describe, expect, it } from "vitest";
import { generateJSON } from "@tiptap/html";
import { Document as DocxDocument, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { editorExtensions } from "@/lib/editor-extensions";
import { detectKind, fileToHtml, ImportError, MAX_IMPORT_BYTES, textToHtml } from "@/lib/import";
import type { DocNode } from "@/lib/content";

const toDoc = (html: string) => generateJSON(html, editorExtensions) as DocNode;
const types = (doc: DocNode) => (doc.content ?? []).map((n) => n.type);
const allMarks = (node: DocNode): string[] => [
  ...(node.marks ?? []).map((m) => m.type),
  ...(node.content ?? []).flatMap(allMarks),
];

describe("detectKind", () => {
  it("accepts supported extensions case-insensitively", () => {
    expect(detectKind("notes.TXT")).toBe("text");
    expect(detectKind("readme.md")).toBe("markdown");
    expect(detectKind("report.docx")).toBe("docx");
  });
  it("rejects unsupported files", () => {
    expect(() => detectKind("image.png")).toThrow(ImportError);
    expect(() => detectKind("noextension")).toThrow(ImportError);
  });
});

describe("text import", () => {
  it("escapes HTML so text can't inject markup", () => {
    expect(textToHtml("<script>alert(1)</script>")).toBe("<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>");
  });
  it("splits paragraphs on blank lines", async () => {
    const { title, html } = await fileToHtml("My notes.txt", Buffer.from("First\n\nSecond"));
    expect(title).toBe("My notes");
    expect(types(toDoc(html))).toEqual(["paragraph", "paragraph"]);
  });
});

describe("markdown import", () => {
  it("maps headings, lists and emphasis to editor nodes", async () => {
    const md = "# Title\n\nSome **bold** and _italic_ text.\n\n- one\n- two\n\n1. first\n2. second\n";
    const doc = toDoc((await fileToHtml("plan.md", Buffer.from(md))).html);
    expect(types(doc)).toEqual(["heading", "paragraph", "bulletList", "orderedList"]);
    expect(doc.content?.[0].attrs?.level).toBe(1);
    expect(allMarks(doc)).toEqual(expect.arrayContaining(["bold", "italic"]));
  });
  it("drops markup the editor doesn't support", async () => {
    const md = 'Hello <script>alert(1)</script><img src="x" onerror="alert(1)">';
    const json = JSON.stringify(toDoc((await fileToHtml("x.md", Buffer.from(md))).html));
    expect(json).not.toMatch(/script|img|onerror/);
  });
});

describe("docx import", () => {
  it("preserves headings and bold text from a real .docx", async () => {
    const file = new DocxDocument({
      sections: [
        {
          children: [
            new Paragraph({ text: "Quarterly report", heading: HeadingLevel.HEADING_1 }),
            new Paragraph({ children: [new TextRun("Revenue was "), new TextRun({ text: "up", bold: true })] }),
          ],
        },
      ],
    });
    const buffer = await Packer.toBuffer(file);
    const { title, html } = await fileToHtml("Q3 report.docx", buffer);
    const doc = toDoc(html);
    expect(title).toBe("Q3 report");
    expect(types(doc)).toEqual(["heading", "paragraph"]);
    expect(allMarks(doc)).toContain("bold");
  });
  it("rejects a non-zip file renamed to .docx", async () => {
    await expect(fileToHtml("fake.docx", Buffer.from("not a zip"))).rejects.toThrow(/valid \.docx/);
  });
});

describe("limits", () => {
  it("rejects empty and oversized files", async () => {
    await expect(fileToHtml("a.txt", Buffer.alloc(0))).rejects.toThrow(/empty/);
    await expect(fileToHtml("a.txt", Buffer.alloc(MAX_IMPORT_BYTES + 1, 97))).rejects.toThrow(/2 MB/);
  });
});
