import React from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { Bold, Italic, Underline as UnderlineIcon, Strikethrough, List, ListOrdered, Heading2, Heading3 } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const toolbarButtonClass =
  'h-8 w-8 rounded-md border border-border/70 bg-background/90 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors inline-flex items-center justify-center';

const toolbarButtonActiveClass = 'text-primary border-primary/50 bg-primary/10';

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          'min-h-[420px] w-full rounded-xl border bg-background/50 p-4 text-foreground focus:outline-none',
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML());
    },
    immediatelyRender: false,
  });

  React.useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) return null;

  return (
    <div className="space-y-3">
      <BubbleMenu
        editor={editor}
        tippyOptions={{ duration: 150 }}
        className="flex items-center gap-1 rounded-lg border border-border bg-card p-1 shadow-lg"
      >
        <button
          type="button"
          className={`${toolbarButtonClass} ${editor.isActive('bold') ? toolbarButtonActiveClass : ''}`}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Жирный"
        >
          <Bold size={15} />
        </button>
        <button
          type="button"
          className={`${toolbarButtonClass} ${editor.isActive('italic') ? toolbarButtonActiveClass : ''}`}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Курсив"
        >
          <Italic size={15} />
        </button>
        <button
          type="button"
          className={`${toolbarButtonClass} ${editor.isActive('underline') ? toolbarButtonActiveClass : ''}`}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Подчеркнутый"
        >
          <UnderlineIcon size={15} />
        </button>
        <button
          type="button"
          className={`${toolbarButtonClass} ${editor.isActive('strike') ? toolbarButtonActiveClass : ''}`}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Зачеркнутый"
        >
          <Strikethrough size={15} />
        </button>
      </BubbleMenu>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/70 bg-card/60 p-2">
        <button
          type="button"
          className={`${toolbarButtonClass} ${editor.isActive('heading', { level: 2 }) ? toolbarButtonActiveClass : ''}`}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Заголовок 2"
        >
          <Heading2 size={15} />
        </button>
        <button
          type="button"
          className={`${toolbarButtonClass} ${editor.isActive('heading', { level: 3 }) ? toolbarButtonActiveClass : ''}`}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Заголовок 3"
        >
          <Heading3 size={15} />
        </button>
        <button
          type="button"
          className={`${toolbarButtonClass} ${editor.isActive('bulletList') ? toolbarButtonActiveClass : ''}`}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Маркированный список"
        >
          <List size={15} />
        </button>
        <button
          type="button"
          className={`${toolbarButtonClass} ${editor.isActive('orderedList') ? toolbarButtonActiveClass : ''}`}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Нумерованный список"
        >
          <ListOrdered size={15} />
        </button>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;
