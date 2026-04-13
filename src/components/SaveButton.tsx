import React from 'react';
import { useTournament } from '@/context/TournamentContext';
import { Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const SaveButton: React.FC = () => {
  const { isAdmin, hasUnsavedChanges, saving, saveError, saveNow } = useTournament();

  if (!isAdmin) return null;
  if (!hasUnsavedChanges && !saving && !saveError) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9998] flex flex-col items-end gap-2">
      {saveError && (
        <div className="flex items-center gap-2 bg-destructive/90 text-white text-xs px-3 py-2 rounded-lg backdrop-blur-sm max-w-xs">
          <AlertCircle size={14} />
          <span>Ошибка: {saveError}</span>
        </div>
      )}
      <button
        onClick={saveNow}
        disabled={saving}
        className="flex items-center gap-2 px-5 py-3 rounded-xl font-heading font-bold text-sm shadow-lg transition-all
          bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed
          animate-in slide-in-from-bottom-2 duration-200"
      >
        {saving ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Сохранение…
          </>
        ) : (
          <>
            <Save size={16} />
            Сохранить в Supabase
          </>
        )}
      </button>
    </div>
  );
};

export default SaveButton;
