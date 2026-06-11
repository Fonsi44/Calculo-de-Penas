'use client';

import { useCallback, useRef } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import LinkExtension from '@tiptap/extension-link';
import {
  Bold, Italic, Underline as UnderlineIcon, Heading2, Heading3,
  List, ListOrdered, Link as LinkIcon, Undo2, Redo2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  minHeight?: number;
  placeholder?: string;
}

function ToolbarButton({ editor, onClick, active, children }: {
  editor: Editor;
  onClick: () => void;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-1.5 rounded hover:bg-border-light transition-colors ${active ? 'bg-accent/15 text-primary' : 'text-text-secondary'}`}
      onMouseDown={e => e.preventDefault()}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({ content, onChange, minHeight = 300, placeholder }: RichTextEditorProps) {
  const linkInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none px-3 py-2 min-h-[300px] text-text',
        style: `min-height: ${minHeight}px`,
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL:', previousUrl || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="border border-border-light rounded-md overflow-hidden bg-surface">
      <div className="flex items-center gap-0.5 p-1.5 border-b border-border-light bg-surface-alt flex-wrap">
        <ToolbarButton editor={editor} onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')}>
          <Bold size={16} />
        </ToolbarButton>
        <ToolbarButton editor={editor} onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')}>
          <Italic size={16} />
        </ToolbarButton>
        <ToolbarButton editor={editor} onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')}>
          <UnderlineIcon size={16} />
        </ToolbarButton>

        <div className="w-px h-5 bg-border-light mx-1" />

        <ToolbarButton editor={editor} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })}>
          <Heading2 size={16} />
        </ToolbarButton>
        <ToolbarButton editor={editor} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })}>
          <Heading3 size={16} />
        </ToolbarButton>

        <div className="w-px h-5 bg-border-light mx-1" />

        <ToolbarButton editor={editor} onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')}>
          <List size={16} />
        </ToolbarButton>
        <ToolbarButton editor={editor} onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')}>
          <ListOrdered size={16} />
        </ToolbarButton>

        <div className="w-px h-5 bg-border-light mx-1" />

        <ToolbarButton editor={editor} onClick={setLink} active={editor.isActive('link')}>
          <LinkIcon size={16} />
        </ToolbarButton>

        <div className="flex-1" />

        <ToolbarButton editor={editor} onClick={() => editor.chain().focus().undo().run()} active={false}>
          <Undo2 size={16} />
        </ToolbarButton>
        <ToolbarButton editor={editor} onClick={() => editor.chain().focus().redo().run()} active={false}>
          <Redo2 size={16} />
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
