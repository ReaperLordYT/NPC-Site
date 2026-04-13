import React, { useState, useRef } from 'react';
import { useTournament } from '@/context/TournamentContext';

interface EditableTextProps {
  value: string;
  onSave: (val: string) => void;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'li';
  className?: string;
  multiline?: boolean;
}

// Simple markdown renderer: **bold**, *italic*, `code`
const renderMarkdown = (text: string) => {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[2]) {
      parts.push(<strong key={key++}>{match[2]}</strong>);
    } else if (match[3]) {
      parts.push(<em key={key++}>{match[3]}</em>);
    } else if (match[4]) {
      parts.push(<code key={key++} className="bg-muted px-1 rounded text-sm">{match[4]}</code>);
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts.length > 0 ? parts : text;
};

const EditableText: React.FC<EditableTextProps> = ({ value, onSave, as: Tag = 'p', className = '', multiline }) => {
  const { isAdmin, isEditing } = useTournament();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value);
  const ref = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  if (!isAdmin || !isEditing) {
    return <Tag className={className}>{renderMarkdown(value)}</Tag>;
  }

  if (editing) {
    return (
      <div className="space-y-1">
        <div className="text-[10px] text-muted-foreground font-heading">
          Markdown: **жирный**, *курсив*, `код`
        </div>
        {multiline ? (
          <textarea
            ref={ref as React.RefObject<HTMLTextAreaElement>}
            className="w-full bg-card border rounded-md p-2 text-foreground resize-y min-h-[60px]"
            value={text}
            onChange={e => setText(e.target.value)}
            onBlur={() => { onSave(text); setEditing(false); }}
            onKeyDown={e => { if (e.key === 'Escape') { setText(value); setEditing(false); } }}
            autoFocus
          />
        ) : (
          <input
            ref={ref as React.RefObject<HTMLInputElement>}
            className="w-full bg-card border rounded-md p-2 text-foreground"
            value={text}
            onChange={e => setText(e.target.value)}
            onBlur={() => { onSave(text); setEditing(false); }}
            onKeyDown={e => {
              if (e.key === 'Enter') { onSave(text); setEditing(false); }
              if (e.key === 'Escape') { setText(value); setEditing(false); }
            }}
            autoFocus
          />
        )}
      </div>
    );
  }

  return (
    <Tag
      className={`${className} editable-highlight cursor-pointer`}
      onClick={() => { setText(value); setEditing(true); }}
      title="Нажмите для редактирования (Markdown: **жирный**, *курсив*)"
    >
      {renderMarkdown(value)}
    </Tag>
  );
};

export default EditableText;
