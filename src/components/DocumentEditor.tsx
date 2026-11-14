"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { EditorContent, useEditor } from "@tiptap/react";
import Placeholder from "@tiptap/extension-placeholder";
import { editorExtensions } from "@/lib/editor-extensions";
import type { DocContent } from "@/lib/content";
import { TRASH_DAYS, type Role } from "@/lib/access";
import { TITLE_MAX } from "@/lib/validation";
import ShareDialog from "./ShareDialog";
import Toolbar from "./Toolbar";
import { DeleteDocumentButton } from "./TrashButtons";
import { useAutosave, type SaveStatus } from "./useAutosave";

const STATUS_TEXT: Record<SaveStatus, string> = {
  saved: "All changes saved",
  dirty: "Unsaved changes",
  saving: "Saving…",
  error: "Couldn't save",
};
const ACCESS_LABEL = { owner: "Owner", editor: "Can edit", viewer: "Can view" } as const;

type Props = {
  id: string;
  initialTitle: string;
  initialContent: DocContent;
  role: Role;
  ownerName: string;
};

export default function DocumentEditor({ id, initialTitle, initialContent, role, ownerName }: Props) {
  const canEdit = role !== "viewer";
  const { status, error, queue, retry } = useAutosave(id);
  const [title, setTitle] = useState(initialTitle);
  const lastValidTitle = useRef(initialTitle);
  const [shareOpen, setShareOpen] = useState(false);

  const editor = useEditor({
    extensions: [...editorExtensions, Placeholder.configure({ placeholder: "Start writing…" })],
    content: initialContent,
    editable: canEdit,
    immediatelyRender: false, // avoid SSR hydration mismatch
    onUpdate: ({ editor }) => queue({ content: editor.getJSON() as DocContent }),
  });

  useEffect(() => {
    document.title = `${title || "Untitled"} | Folio`;
  }, [title]);

  function onTitleChange(value: string) {
    setTitle(value);
    const trimmed = value.trim();
    if (trimmed) {
      lastValidTitle.current = trimmed;
      queue({ title: trimmed });
    }
  }

  return (
    <>
      <div className="editor-top">
        <div className="editor-head">
          <Link href="/documents" className="btn btn-ghost">
            Documents
          </Link>
          <label className="visually-hidden" htmlFor="doc-title">
            Document title
          </label>
          <input
            id="doc-title"
            className="title-input"
            value={title}
            maxLength={TITLE_MAX}
            readOnly={!canEdit}
            onChange={(e) => onTitleChange(e.target.value)}
            onBlur={() => {
              if (!title.trim()) setTitle(lastValidTitle.current);
            }}
          />
          {canEdit && (
            <span className="save-status" data-state={status} aria-live="polite" title={error ?? undefined}>
              {STATUS_TEXT[status]}
              {status === "error" && (
                <>
                  {" "}
                  <button className="btn btn-ghost" onClick={() => void retry()}>
                    Retry
                  </button>
                </>
              )}
            </span>
          )}
          {role === "owner" ? (
            <>
              <DeleteDocumentButton docId={id} title={title} days={TRASH_DAYS} />
              <button className="btn btn-primary" onClick={() => setShareOpen(true)}>
                Share
              </button>
            </>
          ) : (
            <span className="access-note">
              {ownerName}&apos;s document. {ACCESS_LABEL[role]}.
            </span>
          )}
        </div>
        {canEdit && editor && <Toolbar editor={editor} />}
        {!canEdit && <div className="readonly-note">You can view this document. Ask {ownerName} for edit access.</div>}
      </div>

      <main className="doc">
        <EditorContent editor={editor} />
      </main>

      {role === "owner" && <ShareDialog docId={id} open={shareOpen} onClose={() => setShareOpen(false)} />}
    </>
  );
}
