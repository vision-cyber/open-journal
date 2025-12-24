
import React, { useState, useEffect } from 'react';
import { Journal } from '../types';
import { db, auth } from '../services/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

interface MyJournalsProps {
  onEntryClick?: (post: Journal) => void;
}

const MyJournals: React.FC<MyJournalsProps> = ({ onEntryClick }) => {
  const [entries, setEntries] = useState<Journal[]>([]);
  const [filter, setFilter] = useState<'All' | 'Public' | 'Private'>('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "journals"), 
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Journal[];
      
      // Improved sorting to handle pending server timestamps
      const sortedData = data.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || Date.now();
        const timeB = b.createdAt?.toMillis?.() || Date.now();
        return timeB - timeA;
      });

      setEntries(sortedData);
      setLoading(false);
    }, (error) => {
      console.error("Firestore error in MyJournals:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filtered = entries.filter(e => {
    if (filter === 'Public') return e.visibility === 'public';
    if (filter === 'Private') return e.visibility === 'private';
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark animate-in fade-in duration-500">
      <header className="px-4 pt-12 pb-4">
        <h1 className="text-3xl font-black mb-6">My Journals</h1>
        <div className="flex gap-2 mb-4">
          {['All', 'Public', 'Private'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar px-4 pb-28 pt-2 space-y-4">
        {loading ? (
          <div className="py-20 text-center animate-pulse text-slate-400 font-bold uppercase tracking-widest text-xs">Syncing...</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center opacity-30 flex flex-col items-center">
            <span className="material-symbols-outlined text-6xl mb-4">note_add</span>
            <p className="text-sm font-bold uppercase tracking-widest">No reflections yet</p>
          </div>
        ) : (
          filtered.map(entry => (
            <div 
              key={entry.id}
              onClick={() => onEntryClick?.(entry)}
              className={`p-5 rounded-2xl bg-white dark:bg-surface-dark border transition-all cursor-pointer hover:shadow-md ${entry.visibility === 'public' ? 'border-primary/20' : 'border-slate-100 dark:border-slate-800'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg dark:text-white leading-tight">{entry.title}</h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${entry.visibility === 'public' ? 'bg-primary/10 text-primary' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                  {entry.visibility === 'public' ? 'Public' : 'Private'}
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-light line-clamp-2 mb-4">{entry.excerpt}</p>
              <div className="flex flex-wrap gap-2">
                {entry.tags?.map(t => <span key={t} className="text-[10px] font-bold text-primary/40">#{t}</span>)}
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
};

export default MyJournals;
