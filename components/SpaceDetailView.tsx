
import React, { useState, useEffect } from 'react';
import { Space, Journal } from '../types';
import { db, auth } from '../services/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { deleteSpace } from '../services/journalService';
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    setIsCreator(user?.uid === space.createdBy);

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

  const handleDeleteSpace = async () => {
    try {
      await deleteSpace(space.id);
      onBack();
    } catch (error) {
      console.error('Failed to delete space:', error);
      alert('Failed to delete space: ' + error.message);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0d1618] animate-in slide-in-from-right duration-300">
      {/* Compact Header */}
      <header className="px-4 pt-4 pb-6 border-b border-white/5">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          
          {isCreator && (
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-red-500 hover:text-red-400 transition-colors"
            >
              <span className="material-symbols-outlined text-xl">delete</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-4 mb-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-2xl">hub</span>
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-black text-white uppercase tracking-tight leading-none">{space.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[8px] font-black uppercase tracking-widest text-primary px-2 py-0.5 bg-primary/10 rounded border border-primary/20">Active</span>
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">ID: {space.inviteCode}</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-400 font-light leading-relaxed italic px-1">
          "{space.description}"
        </p>
      </header>

      {/* Main Feed */}
      <main className="flex-1 px-4 pb-32">
        <div className="flex items-center justify-between mb-6 py-2">
          <h2 className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Stream</h2>
          <button 
            onClick={onWrite}
            className="flex items-center gap-1.5 text-[9px] font-black text-primary uppercase tracking-widest hover:opacity-80 transition-opacity"
          >
            <span className="material-symbols-outlined text-sm">add_circle</span>
            Add Perspective
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center animate-pulse text-slate-500 font-black uppercase text-[9px] tracking-widest">Loading...</div>
        ) : posts.length > 0 ? (
          <div className="flex flex-col gap-4">
            {posts.map(post => (
              <PostCard key={post.id} post={post} onClick={onPostClick} />
            ))}
          </div>
        ) : (
          <div className="py-24 flex flex-col items-center justify-center text-center opacity-40">
            <span className="material-symbols-outlined text-4xl mb-3 text-slate-600">forum</span>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">No Perspectives Yet</p>
            <p className="text-xs mt-1 text-slate-500 font-light">Be the first to share something.</p>
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      <button 
        onClick={onWrite}
        className="fixed bottom-28 right-4 h-14 w-14 bg-primary text-white rounded-2xl shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 z-50"
      >
        <span className="material-symbols-outlined text-2xl font-black">add</span>
      </button>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-[#112124] border border-white/10 rounded-xl p-5 max-w-sm w-full">
            <h3 className="text-base font-black text-white mb-2">Delete Space?</h3>
            <p className="text-sm text-slate-400 mb-5 leading-relaxed">
              This will permanently delete "{space.name}" and remove all members. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 h-9 bg-white/5 border border-white/10 text-slate-300 font-bold rounded-lg text-sm hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteSpace}
                className="flex-1 h-9 bg-red-500 text-white font-bold rounded-lg text-sm hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpaceDetailView;
