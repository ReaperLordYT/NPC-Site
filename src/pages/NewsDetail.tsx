import React from 'react';
import { useParams, Link } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import { useTournament } from '@/context/TournamentContext';
import { ArrowLeft } from 'lucide-react';
import { formatDate } from '@/lib/dateFormat';

// Render markdown: **bold**, *italic*, `code`
const renderMarkdown = (text: string): React.ReactNode[] => {
  const lines = text.split('\n');
  return lines.map((line, lineIdx) => {
    const parts: React.ReactNode[] = [];
    const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let key = 0;
    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIndex) parts.push(line.slice(lastIndex, match.index));
      if (match[2]) parts.push(<strong key={key++}>{match[2]}</strong>);
      else if (match[3]) parts.push(<em key={key++}>{match[3]}</em>);
      else if (match[4]) parts.push(<code key={key++} className="bg-muted px-1 rounded text-sm">{match[4]}</code>);
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < line.length) parts.push(line.slice(lastIndex));
    return (
      <React.Fragment key={lineIdx}>
        {parts.length > 0 ? parts : line}
        {lineIdx < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
};

const NewsDetail: React.FC = () => {
  const { id } = useParams();
  const { data } = useTournament();
  const news = data.news.find(n => n.id === id);

  if (!news) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-heading text-foreground">Новость не найдена</h1>
          <Link to="/news" className="text-primary mt-4 inline-block">← Назад к новостям</Link>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-16 sm:py-20 max-w-3xl">
        <Link to="/news" className="text-muted-foreground hover:text-primary flex items-center gap-2 mb-8 font-heading">
          <ArrowLeft size={18} /> Назад к новостям
        </Link>
        {news.image && (
          <div className="rounded-2xl overflow-hidden mb-8">
            <img src={news.image} alt={news.title} className="w-full max-h-96 object-cover" />
          </div>
        )}
        <p className="text-sm text-muted-foreground mb-4">{formatDate(news.date)}</p>
        <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-6 break-words">{news.title}</h1>
        <div className="text-muted-foreground leading-relaxed">{renderMarkdown(news.content)}</div>
      </div>
    </PageLayout>
  );
};

export default NewsDetail;
