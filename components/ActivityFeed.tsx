
import React, { useState, useEffect } from 'react';
import { AppNotification, Journal } from '../types';
import { db, auth } from '../services/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';

interface ActivityFeedProps {
  onNavigateToPost?: (post: Journal) => void;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ onNavigateToPost }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [filter, setFilter] = useState<'All' | 'note' | 'star' | 'milestone'>('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Remove orderBy to avoid composite index requirements
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      const rawNotifs = snap.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification));
      
      // Client-side sort by createdAt
      const sorted = rawNotifs.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });

      setNotifications(sorted);
      setLoading(false);
    }, (err) => {
      console.error("Activity feed error:", err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleNotificationClick = async (n: AppNotification) => {
    // Mark as read
    if (!n.read) {
      await updateDoc(doc(db, "notifications", n.id), { read: true });
    }

    // Navigate to post if possible
    if (onNavigateToPost && n.journalId) {
      try {
        const postDoc = await getDoc(doc(db, "journals", n.journalId));
        if (postDoc.exists()) {
          onNavigateToPost({ id: postDoc.id, ...postDoc.data() } as Journal);
        }
      } catch (err) {
        console.error("Error navigating to post:", err);
      }
    }
  };

  const filtered = filter === 'All' ? notifications : notifications.filter(n => n.type === filter);

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    for (const n of unread) {
      await updateDoc(doc(db, "notifications", n.id), { read: true });
    }
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'note': return 'forum';
      case 'star': return 'star';
      case 'milestone': return 'auto_awesome';
      default: return 'notifications';
    }
  };

  const getColor = (type: string) => {
    switch(type) {
      case 'note': return 'bg-primary/10 text-primary';
      case 'star': return 'bg-amber-400/10 text-amber-500';
      case 'milestone': return 'bg-purple-500/10 text-purple-500';
      default: return 'bg-slate-100 text-slate-400';
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark animate-in fade-in duration-500">
      <header className="sticky top-0 z-30 flex flex-col bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-slate-200 dark:border-white/5">
        <div className="flex items-center justify-between px-6 py-5">
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Activity</h1>
          <button 
            onClick={markAllRead} 
            className="text-primary hover:opacity-70 text-[10px] font-black uppercase tracking-[0.2em] transition-opacity"
          >
            Mark all read
          </button>
        </div>

        <div className="w-full px-6 pb-4 flex gap-2 overflow-x-auto no-scrollbar">
          {(['All', 'note', 'star', 'milestone'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shrink-0 transition-all border ${filter === t ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-lg' : 'bg-transparent border-slate-200 dark:border-white/10 text-slate-500'}`}
            >
              {t === 'note' ? 'Notes' : t === 'star' ? 'Stars' : t === 'milestone' ? 'Milestones' : 'All'}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 px-6 pt-6 pb-28 flex flex-col gap-4">
        {loading ? (
          <div className="py-20 text-center animate-pulse text-slate-400 font-bold uppercase text-[10px] tracking-widest">
            Gathering ripples...
          </div>
        ) : filtered.length > 0 ? (
          filtered.map(n => (
            <div 
              key={n.id} 
              onClick={() => handleNotificationClick(n)}
              className={`group flex items-start gap-4 p-5 rounded-3xl border transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.98] ${n.read ? 'bg-transparent border-transparent opacity-50' : 'bg-white dark:bg-surface-dark border-slate-100 dark:border-white/5 shadow-sm hover:shadow-md'}`}
            >
              <div className={`size-12 shrink-0 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${getColor(n.type)}`}>
                <span className={`material-symbols-outlined text-xl ${n.type === 'star' ? 'filled' : ''}`}>{getIcon(n.type)}</span>
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <p className="text-sm font-light text-slate-800 dark:text-slate-200 leading-snug">
                  {n.type === 'note' && (
                    <>
                      <span className="font-bold text-slate-900 dark:text-white">{n.fromUserName}</span> 
                      <span className="ml-1 opacity-70">Someone wrote on your journal</span>
                    </>
                  )}
                  {n.type === 'star' && (
                    <>
                      <span className="font-bold text-slate-900 dark:text-white">{n.fromUserName}</span> 
                      <span className="ml-1 opacity-70">Your note got starred</span>
                    </>
                  )}
                  {n.type === 'milestone' && (
                    <>
                      <span className="font-black text-primary uppercase tracking-tight">Milestone Unlocked!</span> 
                      <p className="mt-1 opacity-70 text-xs">You unlocked something: Space Architect capabilities.</p>
                    </>
                  )}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    {typeof n.createdAt?.toMillis === 'function' ? new Date(n.createdAt.toMillis()).toLocaleDateString() : 'Just now'}
                  </span>
                  {!n.read && <span className="text-[8px] font-black text-primary uppercase tracking-widest">New</span>}
                </div>
              </div>
              {!n.read && <div className="size-2 rounded-full bg-primary mt-3"></div>}
            </div>
          ))
        ) : (
          <div className="py-32 text-center opacity-30 flex flex-col items-center">
            <span className="material-symbols-outlined text-6xl mb-6 font-light">water_drop</span>
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Quiet horizon</p>
            <p className="text-xs mt-2 font-medium">No activity in this frequency yet.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default ActivityFeed;
