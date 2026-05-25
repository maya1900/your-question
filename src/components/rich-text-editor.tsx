"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Code,
  Link2,
  Heading2,
  Quote
} from "lucide-react";

const lowlight = createLowlight(common);

type RichTextEditorProps = {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
};

export function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "link"
        }
      }),
      CodeBlockLowlight.configure({
        lowlight
      })
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "rich-text-content"
      }
    }
  });

  if (!editor) return null;

  const setLink = () => {
    const url = window.prompt("输入链接地址:");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <div className="rich-text-editor">
      <div className="editor-toolbar">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "active" : ""}
          title="粗体"
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? "active" : ""}
          title="斜体"
        >
          <Italic size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive("heading", { level: 2 }) ? "active" : ""}
          title="标题"
        >
          <Heading2 size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive("bulletList") ? "active" : ""}
          title="无序列表"
        >
          <List size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive("orderedList") ? "active" : ""}
          title="有序列表"
        >
          <ListOrdered size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={editor.isActive("codeBlock") ? "active" : ""}
          title="代码块"
        >
          <Code size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive("blockquote") ? "active" : ""}
          title="引用"
        >
          <Quote size={16} />
        </button>
        <button
          type="button"
          onClick={setLink}
          className={editor.isActive("link") ? "active" : ""}
          title="插入链接"
        >
          <Link2 size={16} />
        </button>
      </div>
      <EditorContent editor={editor} placeholder={placeholder} />
    </div>
  );
}
