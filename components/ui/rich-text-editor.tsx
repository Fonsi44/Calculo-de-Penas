'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import LinkExtension from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { FontFamily } from '@tiptap/extension-font-family';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading2, Heading3, List, ListOrdered, ListChecks,
  Link as LinkIcon, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Undo2, Redo2, Type, Palette, Highlighter, RemoveFormatting,
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  minHeight?: number;
}

function Tb({ onClick, active, title, children }: {
  editor: Editor; onClick: () => void; active: boolean; title?: string; children: React.ReactNode;
}) {
  return (
    <button type="button" title={title} onClick={onClick}
      className={`p-1.5 rounded hover:bg-border-light transition-colors ${active ? 'bg-accent/20 text-primary' : 'text-text-secondary'}`}
      onMouseDown={e => e.preventDefault()}>
      {children}
    </button>
  );
}

export function RichTextEditor({ content, onChange, minHeight = 300 }: RichTextEditorProps) {
  const isInternalUpdate = useRef(false);
  const lastExternalContent = useRef(content);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      FontFamily,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      LinkExtension.configure({ openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' } }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none px-3 py-2 text-text',
        style: `min-height: ${minHeight}px`,
      },
    },
    onUpdate: ({ editor }) => {
      isInternalUpdate.current = true;
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      lastExternalContent.current = editor.getHTML();
      return;
    }
    if (content !== lastExternalContent.current) {
      lastExternalContent.current = content;
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes('link').href;
    const url = window.prompt('URL:', prev || 'https://');
    if (url === null) return;
    if (url === '') { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const setColor = useCallback(() => {
    if (!editor) return;
    const current = editor.getAttributes('textStyle').color || '#000000';
    const color = prompt(`Color hex (ej: rojo #991b1b, azul #1e40af):`, current);
    if (color) editor.chain().focus().setColor(color).run();
  }, [editor]);

  const setFont = useCallback(() => {
    if (!editor) return;
    const fonts = [['Predeterminado',''],['Serif (Times)','serif'],['Sans (Arial)','sans-serif'],['Mono (Courier)','monospace']];
    const names = fonts.map(([n]) => n).join(', ');
    const font = prompt(`Fuente: ${names}`, '');
    if (font === null) return;
    const found = fonts.find(([n]) => n.toLowerCase().startsWith(font.toLowerCase()));
    if (found) { editor.chain().focus().setFontFamily(found[1]).run(); }
  }, [editor]);

  if (!editor) return null;

  const sep = <div className="w-px h-5 bg-border-light mx-0.5" />;

  return (
    <div className="border border-border-light rounded-md overflow-hidden bg-surface">
      {/* Toolbar fila 1: formato básico */}
      <div className="flex items-center gap-0.5 p-1 border-b border-border-light bg-surface-alt flex-wrap">
        <Tb editor={editor} onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Negrita (Ctrl+B)"><Bold size={15} /></Tb>
        <Tb editor={editor} onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Cursiva (Ctrl+I)"><Italic size={15} /></Tb>
        <Tb editor={editor} onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Subrayado (Ctrl+U)"><UnderlineIcon size={15} /></Tb>
        <Tb editor={editor} onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Tachado"><Strikethrough size={15} /></Tb>

        {sep}

        <Tb editor={editor} onClick={setColor} active={!!editor.getAttributes('textStyle').color} title="Color de texto"><Palette size={15} /></Tb>
        <Tb editor={editor} onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title="Resaltado"><Highlighter size={15} /></Tb>

        {sep}

        <Tb editor={editor} onClick={setFont} active={false} title="Fuente"><Type size={15} /></Tb>

        {sep}

        <Tb editor={editor} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Título H2"><Heading2 size={15} /></Tb>
        <Tb editor={editor} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Subtítulo H3"><Heading3 size={15} /></Tb>
      </div>

      {/* Toolbar fila 2: alineación, listas, enlaces */}
      <div className="flex items-center gap-0.5 p-1 border-b border-border-light bg-surface-alt flex-wrap">
        <Tb editor={editor} onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Alinear izquierda"><AlignLeft size={15} /></Tb>
        <Tb editor={editor} onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Centrar"><AlignCenter size={15} /></Tb>
        <Tb editor={editor} onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Alinear derecha"><AlignRight size={15} /></Tb>
        <Tb editor={editor} onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justificar"><AlignJustify size={15} /></Tb>

        {sep}

        <Tb editor={editor} onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Lista viñetas"><List size={15} /></Tb>
        <Tb editor={editor} onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Lista numerada"><ListOrdered size={15} /></Tb>
        <Tb editor={editor} onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive('taskList')} title="Lista checklist"><ListChecks size={15} /></Tb>

        {sep}

        <Tb editor={editor} onClick={setLink} active={editor.isActive('link')} title="Insertar enlace"><LinkIcon size={15} /></Tb>
        <Tb editor={editor} onClick={() => editor.chain().focus().unsetAllMarks().run()} active={false} title="Limpiar formato"><RemoveFormatting size={15} /></Tb>

        {sep}

        <Tb editor={editor} onClick={() => editor.chain().focus().undo().run()} active={false} title="Deshacer (Ctrl+Z)"><Undo2 size={15} /></Tb>
        <Tb editor={editor} onClick={() => editor.chain().focus().redo().run()} active={false} title="Rehacer (Ctrl+Shift+Z)"><Redo2 size={15} /></Tb>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
