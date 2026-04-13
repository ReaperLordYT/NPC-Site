import React from 'react';
import { Link } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import { useTournament } from '@/context/TournamentContext';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import NewsEditor from '@/components/NewsEditor';
import { formatDate } from '@/lib/dateFormat';

const News: React.FC = () => {
  const { data, isAdmin, isEditing, deleteNews } = useTournament();
  const [showEditor, setShowEditor] = React.useState(false);
  const [editingNews, setEditingNews] = React.useState<string | null>(null);

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-20">
        <div className="flex items-center justify-between mb-12">
          <h1 className="font-display text-4xl md:text-5xl font-bold gradient-text">Новости</h1>
          {isAdmin && isEditing && (
            <button
              onClick={() => { setEditingNews(null); setShowEditor(true); }}
              className="btn-primary-gradient px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Plus size={18} /> Добавить
            </button>
          )}
        </div>

        {showEditor && (
          <NewsEditor
            newsId={editingNews}
            onClose={() => { setShowEditor(false); setEditingNews(null); }}
          />
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.news.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="relative group"
            >
              <Link to={`/news/${item.id}`} className="block glass-card rounded-xl overflow-hidden card-glow">
                {item.image && (
                  <div className="h-48 overflow-hidden">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                )}
                <div className="p-6">
                  <p className="text-xs text-muted-foreground mb-2">{formatDate(item.date)}</p>
                  <h3 className="font-heading font-bold text-lg text-foreground mb-2 group-hover:text-primary transition-colors">{item.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-3">{item.summary}</p>
                  <span className="text-primary font-heading text-sm mt-3 inline-block">Читать →</span>
                </div>
              </Link>
              {isAdmin && isEditing && (
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    onClick={(e) => { e.preventDefault(); setEditingNews(item.id); setShowEditor(true); }}
                    className="p-2 bg-card/90 rounded-md text-foreground hover:text-primary"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={(e) => { e.preventDefault(); deleteNews(item.id); }}
                    className="p-2 bg-card/90 rounded-md text-foreground hover:text-destructive"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {data.news.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">Новостей пока нет</div>
        )}
      </div>
    </PageLayout>
  );
};

export default News;
