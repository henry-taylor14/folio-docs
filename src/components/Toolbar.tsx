"use client";

import type { Editor } from "@tiptap/react";

type Item = {
  label: string;
  title: string;
  isActive?: () => boolean;
  run: () => void;
  disabled?: () => boolean;
  style?: React.CSSProperties;
};

export default function Toolbar({ editor }: { editor: Editor }) {
  const groups: Item[][] = [
    [
      { label: "Undo", title: "Undo (Ctrl/⌘+Z)", run: () => editor.chain().focus().undo().run(), disabled: () => !editor.can().undo() },
      { label: "Redo", title: "Redo (Ctrl/⌘+Shift+Z)", run: () => editor.chain().focus().redo().run(), disabled: () => !editor.can().redo() },
    ],
    [
      { label: "Text", title: "Normal text", isActive: () => editor.isActive("paragraph"), run: () => editor.chain().focus().setParagraph().run() },
      { label: "H1", title: "Heading 1", isActive: () => editor.isActive("heading", { level: 1 }), run: () => editor.chain().focus().toggleHeading({ level: 1 }).run() },
      { label: "H2", title: "Heading 2", isActive: () => editor.isActive("heading", { level: 2 }), run: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
      { label: "H3", title: "Heading 3", isActive: () => editor.isActive("heading", { level: 3 }), run: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    ],
    [
      { label: "B", title: "Bold (Ctrl/⌘+B)", style: { fontWeight: 700 }, isActive: () => editor.isActive("bold"), run: () => editor.chain().focus().toggleBold().run() },
      { label: "I", title: "Italic (Ctrl/⌘+I)", style: { fontStyle: "italic" }, isActive: () => editor.isActive("italic"), run: () => editor.chain().focus().toggleItalic().run() },
      { label: "U", title: "Underline (Ctrl/⌘+U)", style: { textDecoration: "underline" }, isActive: () => editor.isActive("underline"), run: () => editor.chain().focus().toggleUnderline().run() },
      { label: "S", title: "Strikethrough", style: { textDecoration: "line-through" }, isActive: () => editor.isActive("strike"), run: () => editor.chain().focus().toggleStrike().run() },
    ],
    [
      { label: "• List", title: "Bulleted list", isActive: () => editor.isActive("bulletList"), run: () => editor.chain().focus().toggleBulletList().run() },
      { label: "1. List", title: "Numbered list", isActive: () => editor.isActive("orderedList"), run: () => editor.chain().focus().toggleOrderedList().run() },
      { label: "Quote", title: "Block quote", isActive: () => editor.isActive("blockquote"), run: () => editor.chain().focus().toggleBlockquote().run() },
    ],
  ];

  return (
    <div className="toolbar" role="toolbar" aria-label="Formatting">
      {groups.map((group, gi) => (
        <span key={gi} style={{ display: "contents" }}>
          {gi > 0 && <span className="sep" aria-hidden />}
          {group.map((item) => (
            <button
              key={item.title}
              type="button"
              className="tb"
              title={item.title}
              aria-label={item.title}
              aria-pressed={item.isActive ? item.isActive() : undefined}
              disabled={item.disabled?.()}
              style={item.style}
              onMouseDown={(e) => e.preventDefault() /* keep editor selection */}
              onClick={item.run}
            >
              {item.label}
            </button>
          ))}
        </span>
      ))}
    </div>
  );
}
