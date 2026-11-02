"use client";

import { useEffect, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import Youtube from "@tiptap/extension-youtube";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Node, mergeAttributes } from "@tiptap/core";
import { MediaPicker } from "./MediaPicker";

/** Inline <video> block (mp4 from the media library). */
const VideoNode = Node.create({
  name: "video",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() {
    return { src: { default: null }, poster: { default: null } };
  },
  parseHTML() {
    return [{ tag: "video[src]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["video", mergeAttributes(HTMLAttributes, { class: "rm-video", controls: "true", playsinline: "true", preload: "metadata" })];
  },
});

export function RichText({ name, defaultValue, placeholder, minHeight = 240 }: { name: string; defaultValue: string; placeholder?: string; minHeight?: number }) {
  const [html, setHtml] = useState(defaultValue ?? "");
  const [picker, setPicker] = useState<null | "image" | "video">(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] }, link: false }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true, defaultProtocol: "https", HTMLAttributes: { rel: "noopener" } }),
      Image.configure({ inline: false, allowBase64: false }),
      VideoNode,
      Youtube.configure({ controls: true, nocookie: true, HTMLAttributes: { class: "rm-embed" } }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder: placeholder ?? "Start writing…" }),
    ],
    content: defaultValue || "",
    editorProps: { attributes: { class: "prose-rm rm-editor focus:outline-none", style: `min-height:${minHeight}px` } },
    onUpdate: ({ editor }) => setHtml(editor.isEmpty ? "" : editor.getHTML()),
  });


  if (!editor) return <div className="rounded border border-neutral-300 bg-white p-3 text-sm text-neutral-400" style={{ minHeight }}>Loading editor…</div>;

  return (
    <div className="rounded border border-neutral-300 bg-white">
      <input type="hidden" name={name} value={html} readOnly />
      <Toolbar editor={editor} onImage={() => setPicker("image")} onVideo={() => setPicker("video")} />
      <div className="px-4 py-3">
        <EditorContent editor={editor} />
      </div>
      {picker && (
        <MediaPicker
          kind={picker}
          onClose={() => setPicker(null)}
          onPick={(m) => {
            if (picker === "image") editor.chain().focus().setImage({ src: m.url, alt: m.alt }).run();
            else editor.chain().focus().insertContent({ type: "video", attrs: { src: m.url } }).run();
            setPicker(null);
          }}
        />
      )}
    </div>
  );
}

function Btn({ on, active, title, children, disabled }: { on: () => void; active?: boolean; title: string; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={on} title={title} disabled={disabled} className={`rounded px-2 py-1 text-xs ${active ? "bg-neutral-900 text-white" : "hover:bg-neutral-100"} disabled:opacity-30`}>
      {children}
    </button>
  );
}

function Toolbar({ editor, onImage, onVideo }: { editor: Editor; onImage: () => void; onVideo: () => void }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const r = () => tick((n) => n + 1);
    editor.on("transaction", r);
    return () => { editor.off("transaction", r); };
  }, [editor]);

  const setLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL (https://… , mailto:… or /path)", prev ?? "https://");
    if (url === null) return;
    if (url === "") editor.chain().focus().extendMarkRange("link").unsetLink().run();
    else editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };
  const addYoutube = () => {
    const url = window.prompt("YouTube URL");
    if (url) editor.commands.setYoutubeVideo({ src: url });
  };
  const inTable = editor.isActive("table");

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-neutral-200 px-2 py-1">
      <Btn title="Paragraph" active={editor.isActive("paragraph")} on={() => editor.chain().focus().setParagraph().run()}>¶</Btn>
      <Btn title="Heading 2" active={editor.isActive("heading", { level: 2 })} on={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</Btn>
      <Btn title="Heading 3" active={editor.isActive("heading", { level: 3 })} on={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</Btn>
      <Btn title="Heading 4" active={editor.isActive("heading", { level: 4 })} on={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}>H4</Btn>
      <Sep />
      <Btn title="Bold" active={editor.isActive("bold")} on={() => editor.chain().focus().toggleBold().run()}><b>B</b></Btn>
      <Btn title="Italic" active={editor.isActive("italic")} on={() => editor.chain().focus().toggleItalic().run()}><i>I</i></Btn>
      <Btn title="Underline" active={editor.isActive("underline")} on={() => editor.chain().focus().toggleUnderline().run()}><u>U</u></Btn>
      <Btn title="Strike" active={editor.isActive("strike")} on={() => editor.chain().focus().toggleStrike().run()}><s>S</s></Btn>
      <Sep />
      <Btn title="Bullet list" active={editor.isActive("bulletList")} on={() => editor.chain().focus().toggleBulletList().run()}>• List</Btn>
      <Btn title="Numbered list" active={editor.isActive("orderedList")} on={() => editor.chain().focus().toggleOrderedList().run()}>1. List</Btn>
      <Btn title="Quote" active={editor.isActive("blockquote")} on={() => editor.chain().focus().toggleBlockquote().run()}>“ ”</Btn>
      <Btn title="Horizontal rule" on={() => editor.chain().focus().setHorizontalRule().run()}>—</Btn>
      <Sep />
      <Btn title="Link" active={editor.isActive("link")} on={setLink}>Link</Btn>
      <Btn title="Image from library" on={onImage}>Image</Btn>
      <Btn title="Video from library" on={onVideo}>Video</Btn>
      <Btn title="YouTube" on={addYoutube}>YouTube</Btn>
      <Sep />
      <Btn title="Insert table" on={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>Table</Btn>
      {inTable && (
        <>
          <Btn title="Add row" on={() => editor.chain().focus().addRowAfter().run()}>+Row</Btn>
          <Btn title="Add column" on={() => editor.chain().focus().addColumnAfter().run()}>+Col</Btn>
          <Btn title="Delete row" on={() => editor.chain().focus().deleteRow().run()}>−Row</Btn>
          <Btn title="Delete column" on={() => editor.chain().focus().deleteColumn().run()}>−Col</Btn>
          <Btn title="Toggle header row" on={() => editor.chain().focus().toggleHeaderRow().run()}>Hdr</Btn>
          <Btn title="Delete table" on={() => editor.chain().focus().deleteTable().run()}>✕ Table</Btn>
        </>
      )}
      <Sep />
      <Btn title="Clear formatting" on={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}>Clear</Btn>
      <Btn title="Undo" disabled={!editor.can().undo()} on={() => editor.chain().focus().undo().run()}>↶</Btn>
      <Btn title="Redo" disabled={!editor.can().redo()} on={() => editor.chain().focus().redo().run()}>↷</Btn>
    </div>
  );
}

function Sep() {
  return <span className="mx-1 h-4 w-px bg-neutral-200" />;
}
