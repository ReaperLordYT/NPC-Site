import React, { useState, useRef } from 'react';
import { useTournament } from '@/context/TournamentContext';
import { NewsItem } from '@/types/tournament';
import { X, Image } from 'lucide-react';

interface NewsEditorProps {
  newsId: string | null;
  onClose: () => void;
}

const NewsEditor: React.FC<NewsEditorProps> = ({ newsId, onClose }) => {
  const { data, addNews, updateNews } = useTournament();
  const existing = newsId ? data.news.find(n => n.id === newsId) : null;

  const [title, setTitle] = useState(existing?.title || '');
  const [summary, setSummary] = useState(existing?.summary || '');
  const [content, setContent] = useState(existing?.content || '');
  const [image, setImage] = useState(existing?.image || '');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!title.trim()) return;
    const item: NewsItem = {
      id: existing?.id || Date.now().toString(),
      title, summary, content, image,
      date: existing?.date || new Date().toISOString().split('T')[0],
    };
    if (existing) updateNews(item);
    else addNews(item);
    onClose();
  };

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-6 mb-8 relative max-h-[85vh] overflow-y-auto pb-24 sm:pb-6">
      <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
        <X size={20} />
      </button>
      <h3 className="font-heading text-xl font-bold mb-4 text-foreground">{existing ? 'Редактировать' : 'Новая новость'}</h3>
      <div className="space-y-4">
        <input className="w-full bg-background border rounded-lg p-3 text-foreground" placeholder="Заголовок" value={title} onChange={e => setTitle(e.target.value)} />
        <input className="w-full bg-background border rounded-lg p-3 text-foreground" placeholder="Краткое описание" value={summary} onChange={e => setSummary(e.target.value)} />
        <div>
          <div className="text-[11px] text-muted-foreground font-heading mb-1">
            Markdown: **жирный**, *курсив*, `код`
          </div>
          <textarea
            className="w-full bg-background border rounded-lg p-3 text-foreground min-h-[120px] resize-y"
            placeholder="Полный текст новости (поддерживается Markdown: **жирный**, *курсив*)"
            value={content}
            onChange={e => setContent(e.target.value)}
          />
        </div>
        <div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 px-4 py-2 border rounded-lg text-muted-foreground hover:text-foreground hover:border-primary transition-colors">
            <Image size={18} /> {image ? 'Изменить фото' : 'Добавить фото'}
          </button>
          {image && (
            <div className="mt-3 relative inline-block">
              <img src={image} alt="preview" className="h-32 rounded-lg object-cover" />
              <button onClick={() => setImage('')} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"><X size={12} /></button>
            </div>
          )}
        </div>
        <button onClick={handleSave} className="hidden sm:inline-flex btn-primary-gradient px-6 py-2 rounded-lg">
          {existing ? 'Сохранить' : 'Опубликовать'}
        </button>
      </div>
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur p-3">
        <div className="max-w-4xl mx-auto grid grid-cols-2 gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border text-xs text-muted-foreground hover:text-foreground">
            Отмена
          </button>
          <button onClick={handleSave} className="btn-primary-gradient px-4 py-2 rounded-lg text-xs">
            {existing ? 'Сохранить' : 'Опубликовать'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewsEditor;
