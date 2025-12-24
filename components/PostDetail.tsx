
import React, { useState, useEffect } from 'react';
import { Journal, Note, Space } from '../types';
import { auth, db } from '../services/firebase';
import { collection, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { starNote, addNote, isUserInSpace } from '../services/journalService';

interface PostDetailProps {
  post: Journal;
  onBack: () => void;
}

const PostDetail: React.FC<PostDetailProps> = ({ post, onBack }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteInput, setNoteInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMember, setIsMember] = useState<boolean | null>(null);
  const [spaceInfo, setSpaceInfo] = useState<Space | null>(null);
  
  const currentUserId = auth.currentUser?.uid;
  const isOwner = post.userId === currentUserId;

  useEffect(() => {
    const q = query(collection(db, "journals", post.id, "notes"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setNotes(snap.docs.map(d => ({ id: d.id, ...d.data() } as Note)));
    });

    const verifyMembership = async () => {
      if (post.spaceId && currentUserId) {
        const member = await isUserInSpace(currentUserId, post.spaceId);
        setIsMember(member);
        
        const spaceDoc = await getDoc(doc(db, "spaces", post.spaceId));
        if (spaceDoc.exists()) {
          setSpaceInfo({ id: spaceDoc.id, ...spaceDoc.data() } as Space);
        }
      } else {
        setIsMember(true);
      }
    };

    verifyMembership();
    return () => unsub();
  }, [post.id, post.spaceId, currentUserId]);

  const handleSendNote = async () => {
    if (!noteInput.trim() || loading || !isMember) return;
    setLoading(true);
    try {
      await addNote(post.id, noteInput, post.userId);
      setNoteInput('');
    } finally {
      setLoading(false);
    }
  };

  const handleStar = async (note: Note) => {
    if (!isOwner || note.starred || note.userId === currentUserId) return;
    await starNote(post.id, note.id, note.userId);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0d1618] text-slate-200 animate-in fade-in duration-300">
      <header className="sticky top-0 z-50 bg-[#0d1618]/95 backdrop-blur-2xl px-4 py-3 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1 text-slate-400 hover:text-white transition-all">
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
          </button>
          <div className="flex flex-col">
            <span className="text-xs font-black text-white leading-tight">{post.authorHandle}</span>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
              {spaceInfo ? `in ${spaceInfo.name}` : 'Public Feed'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button className="h-8 px-4 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-widest hover:bg-primary/20 transition-all">
             Join
           </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar max-w-2xl mx-auto w-full">
        {/* HERO IMAGE SECTION */}
        {post.imageUrl && (
          <div className="w-full aspect-video md:h-80 overflow-hidden relative">
            <img 
              src={post.imageUrl} 
              alt={post.title} 
              className="w-full h-full object-cover animate-in fade-in zoom-in duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d1618] to-transparent opacity-40"></div>
          </div>
        )}

        <article className="px-5 pt-8 pb-8 border-b border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center text-[9px] font-black uppercase text-slate-400">
              {post.authorName.charAt(0)}
            </div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{post.authorName}</span>
            <span className="text-slate-600 text-[10px]">•</span>
            <span className="text-[10px] text-slate-500 font-medium">
              {typeof post.createdAt?.toMillis === 'function' ? new Date(post.createdAt.toMillis()).toLocaleDateString() : 'Recent'}
            </span>
          </div>

          <h1 className="text-3xl font-black mb-6 leading-tight text-white tracking-tight uppercase">
            {post.title}
          </h1>
          
          <div className="prose prose-sm prose-invert max-w-none">
            <div 
              className="text-base leading-relaxed font-light text-slate-300 mb-8 whitespace-pre-wrap journal-content"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {post.tags.map(t => (
              <span key={t} className="px-2.5 py-1 bg-white/5 rounded-md text-[9px] font-black text-slate-500 uppercase tracking-widest border border-white/5">#{t}</span>
            ))}
          </div>
        </article>

        <section className="px-5 pt-8 pb-32">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              {notes.length} Comments
            </h2>
          </div>
          
          <div className="space-y-4">
            {notes.length > 0 ? notes.map(note => (
              <div key={note.id} className="relative pl-4 border-l-2 border-white/5 py-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-black text-primary/80">{note.authorHandle}</span>
                  <span className="text-[8px] text-slate-600 uppercase font-bold tracking-widest">
                    {typeof note.createdAt?.toMillis === 'function' ? new Date(note.createdAt.toMillis()).toLocaleDateString() : 'now'}
                  </span>
                  {note.starred && (
                    <span className="material-symbols-outlined text-[10px] text-amber-400 filled ml-1">star</span>
                  )}
                </div>
                <p className="text-sm font-light text-slate-300 leading-relaxed mb-3">{note.content}</p>
                <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-slate-600">
                  <button className="hover:text-slate-300 transition-colors">Upvote</button>
                  <button className="hover:text-slate-300 transition-colors">Reply</button>
                  {isOwner && !note.starred && note.userId !== currentUserId && (
                    <button onClick={() => handleStar(note)} className="text-amber-500/50 hover:text-amber-400 transition-colors">Star</button>
                  )}
                </div>
              </div>
            )) : (
              <div className="py-12 text-center opacity-20">
                <span className="material-symbols-outlined text-4xl mb-2">chat_bubble</span>
                <p className="text-[9px] font-black uppercase tracking-widest">No thoughts yet</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-4 z-40 bg-[#0d1618]/90 backdrop-blur-md border-t border-white/5">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          {isMember === false ? (
            <div className="w-full h-12 flex items-center justify-center bg-red-500/5 border border-red-500/10 rounded-xl">
               <span className="material-symbols-outlined text-red-500/50 text-sm mr-2">lock_person</span>
               <p className="text-[9px] font-black text-red-500/50 uppercase tracking-widest">Connect to post</p>
            </div>
          ) : (
            <>
              <input 
                type="text" 
                placeholder="What are your thoughts?"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendNote()}
                className="flex-1 h-12 px-5 bg-white/5 border border-white/5 rounded-xl text-sm text-white placeholder:text-slate-600 focus:ring-1 focus:ring-primary/40 focus:outline-none transition-all"
              />
              <button 
                onClick={handleSendNote}
                disabled={!noteInput.trim() || loading}
                className="h-12 px-6 bg-primary text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 disabled:opacity-20 transition-all"
              >
                Post
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
