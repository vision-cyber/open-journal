
import React, { useState, useEffect } from 'react';
import { Journal } from '../types';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import PostCard from './PostCard';
import JournalSpots from './JournalSpots';

interface DiscoverViewProps {
  onPostClick: (post: Journal) => void;
}

const DiscoverView: React.FC<DiscoverViewProps> = ({ onPostClick }) => {
  const [posts, setPosts] = useState<Journal[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let q;
    setError(null);
    setLoading(true);

    try {
      if (selectedTag) {
        q = query(
          collection(db, "journals"),
          where("visibility", "==", "public"),
          where("tags", "array-contains", selectedTag)
        );
      } else {
        q = query(
          collection(db, "journals"),
          where("visibility", "==", "public")
        );
      }

      const unsub = onSnapshot(q, (snap) => {
        const rawPosts = snap.docs.map(d => ({ id: d.id, ...d.data() } as Journal));
        
        // Improved sorting to handle pending server timestamps (client-side latency compensation)
        const sortedPosts = rawPosts.sort((a, b) => {
          const timeA = a.createdAt?.toMillis?.() || Date.now();
          const timeB = b.createdAt?.toMillis?.() || Date.now();
          return timeB - timeA;
        });

        setPosts(sortedPosts);
        setLoading(false);
      }, (err) => {
        console.error("Firestore Error:", err);
        setError("Unable to sync reflections.");
        setLoading(false);
      });

      return () => unsub();
    } catch (err) {
      console.error("Query Setup Error:", err);
      setLoading(false);
    }
  }, [selectedTag]);

  const allTags = Array.from(new Set(posts.flatMap(p => p.tags || []))).sort();

  return (
    <div className="flex flex-col min-h-screen bg-[#0d1618]">
      <header className="sticky top-0 z-30 bg-[#0d1618]/95 backdrop-blur-md border-b border-white/5 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-black tracking-tight text-white uppercase">Home</h1>
          <button className="material-symbols-outlined text-slate-500 text-xl">tune</button>
        </div>
        
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setSelectedTag(null)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all shrink-0 ${!selectedTag ? 'bg-primary text-white' : 'bg-white/5 text-slate-500 border border-white/5'}`}
          >
            All
          </button>
          {allTags.map(tag => (
            <button 
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all shrink-0 ${selectedTag === tag ? 'bg-primary text-white' : 'bg-white/5 text-slate-500 border border-white/5'}`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </header>

      <main className="px-3 py-3 flex flex-col gap-4 pb-32">
        {!selectedTag && <JournalSpots />}

        {loading ? (
          <div className="py-20 text-center animate-pulse font-black uppercase text-slate-600 tracking-widest text-[10px]">Syncing...</div>
        ) : error ? (
          <div className="py-20 text-center px-12">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 leading-relaxed">{error}</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="py-20 text-center opacity-30 flex flex-col items-center">
            <p className="text-[10px] font-black uppercase tracking-widest">No reflections</p>
          </div>
        ) : (
          posts.map(post => (
            <PostCard key={post.id} post={post} onClick={onPostClick} />
          ))
        )}
      </main>
    </div>
  );
};

export default DiscoverView;
