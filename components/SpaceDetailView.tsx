
import React, { useState, useEffect } from 'react';
import { Space, Journal } from '../types';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import PostCard from './PostCard';

interface SpaceDetailViewProps {
  space: Space;
  onBack: () => void;
  onPostClick: (post: Journal) => void;
  onWrite: () => void;
}

const SpaceDetailView: React.FC<SpaceDetailViewProps> = ({ space, onBack, onPostClick, onWrite }) => {
  const [posts, setPosts] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "journals"),
      where("spaceId", "==", space.id)
    );

    const unsub = onSnapshot(q, (snap) => {
      const rawPosts = snap.docs.map(d => ({ id: d.id, ...d.data() } as Journal));
      const sorted = rawPosts.sort((a, b) => {
        const tA = a.createdAt?.toMillis?.() || 0;
        const tB = b.createdAt?.toMillis?.() || 0;
        return tB - tA;
      });
      setPosts(sorted);
      setLoading(false);
    });

    return () => unsub();
  }, [space.id]);

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark animate-in slide-in-from-right duration-300">
      {/* Dynamic Header */}
      <header className="relative pt-12 pb-8 px-6 overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -z-10 translate-x-1/2 -translate-y-1/2"></div>
        
        <button onClick={onBack} className="p-2 -ml-2 text-slate-500 mb-6 hover:text-primary transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>

        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none mb-2">{space.name}</h1>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary px-3 py-1 bg-primary/10 rounded-full border border-primary/20">Active Frequency</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {space.inviteCode}</span>
            </div>
          </div>
          <div className="w-16 h-16 rounded-[2rem] bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-900 shadow-2xl">
            <span className="material-symbols-outlined text-3xl">hub</span>
          </div>
        </div>

        <p className="text-slate-500 dark:text-slate-400 font-light leading-relaxed max-w-sm italic">
          "{space.description}"
        </p>
      </header>

      {/* Main Feed */}
      <main className="flex-1 px-4 pb-40">
        <div className="flex items-center justify-between mb-8 px-2">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Space Stream</h2>
          <button 
            onClick={onWrite}
            className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest"
          >
            <span className="material-symbols-outlined text-sm">add_circle</span>
            Add Perspective
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center animate-pulse text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em]">Opening Frequency...</div>
        ) : posts.length > 0 ? (
          <div className="flex flex-col gap-6">
            {posts.map(post => (
              <PostCard key={post.id} post={post} onClick={onPostClick} />
            ))}
          </div>
        ) : (
          <div className="py-32 flex flex-col items-center justify-center text-center opacity-30">
            <span className="material-symbols-outlined text-6xl mb-4 font-light">bubble_chart</span>
            <p className="text-[10px] font-black uppercase tracking-[0.4em]">Quiet Hub</p>
            <p className="text-xs mt-2 italic font-light">The first perspective is waiting to be shared.</p>
          </div>
        )}
      </main>

      {/* Action FAB for this space */}
      <button 
        onClick={onWrite}
        className="fixed bottom-28 right-6 h-16 w-16 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-3xl shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-50 border-4 border-background-light dark:border-background-dark"
      >
        <span className="material-symbols-outlined text-3xl font-black">edit_note</span>
      </button>
    </div>
  );
};

export default SpaceDetailView;
