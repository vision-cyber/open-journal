import React, { useState } from 'react';
import { Journal } from '../types';

interface SpacePerspectiveProps {
  spaceId: string;
  spaceName: string;
  onClose: () => void;
  onSave: (post: Partial<Journal>) => Promise<void>;
}

const SpacePerspective: React.FC<SpacePerspectiveProps> = ({ spaceId, spaceName, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim() || !description.trim()) return;
    
    setIsSaving(true);
    try {
      await onSave({
        title: title.trim(),
        content: description.trim(),
        excerpt: description.substring(0, 150) + "...",
        visibility: 'space',
        spaceId,
        tags: [],
        mood: 'Calm'
      });
      onClose();
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#081416] text-white flex flex-col animate-in fade-in slide-in-from-bottom duration-300">
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
          <span className="material-symbols-outlined text-xl">close</span>
        </button>
        <h1 className="text-xs font-black uppercase tracking-widest text-slate-500">Add to {spaceName}</h1>
        <button 
          onClick={handleSave} 
          disabled={isSaving || !title.trim() || !description.trim()}
          className="text-primary text-sm font-black uppercase tracking-widest hover:opacity-80 disabled:opacity-30 transition-all"
        >
          {isSaving ? 'Adding' : 'Add'}
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="max-w-lg mx-auto space-y-6">
          
          {/* Title Input */}
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">
              Title
            </label>
            <input 
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="What's this about?"
              className="w-full h-12 bg-white/5 border border-white/5 rounded-lg px-4 text-sm font-medium text-white placeholder:text-slate-600 focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>

          {/* Description Input */}
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">
              Description
            </label>
            <textarea 
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Share your thoughts, ideas, or details..."
              className="w-full bg-white/5 border border-white/5 rounded-lg px-4 py-3 text-sm font-light text-white placeholder:text-slate-600 focus:ring-1 focus:ring-primary focus:border-primary h-40 resize-none"
            />
          </div>

        </div>
      </main>
    </div>
  );
};

export default SpacePerspective;