/** Minimal structural type for TipTap/ProseMirror JSON. */
export type DocNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: DocNode[];
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  text?: string;
};

export type DocContent = DocNode & { type: "doc" };

export const EMPTY_DOC: DocContent = { type: "doc", content: [{ type: "paragraph" }] };
