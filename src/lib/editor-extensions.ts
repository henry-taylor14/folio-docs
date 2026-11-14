import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";

/**
 * Single source of truth for the document schema. Used by the editor and by
 * import (generateJSON) so imported content can only contain nodes/marks the
 * editor supports.
 */
export const editorExtensions = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    codeBlock: false,
    code: false,
    horizontalRule: false,
  }),
  Underline,
];
