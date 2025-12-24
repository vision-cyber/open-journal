
import React, { useState, useEffect } from 'react';
import { View, UserProfileData, Space } from '../types';
import { auth, db } from '../services/firebase';
import { signOut } from 'firebase/auth';
import { doc, onSnapshot, collection, query, where, getDocs, getDoc } from 'firebase/firestore';

interface UserProfileProps {
  onNavigate: (view: View) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ onNavigate }) => {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [userSpaces, setUserSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const unsubProfile = onSnapshot(doc(db, "users", user.uid), (doc) => {
      if (doc.exists()) {
        setProfile(doc.data() as UserProfileData);
      }
    });

    const q = query(collection(db, "userSpaces"), where("userId", "==", user.uid));
    const unsubSpaces = onSnapshot(q, async (snap) => {
      const spacePromises = snap.docs.map(async (d) => {
        const sid = d.data().spaceId;
        const sdoc = await getDoc(doc(db, "spaces", sid));
        return sdoc.exists() ? ({ id: sdoc.id, ...sdoc.data() } as Space) : null;
      });
      const spaceList = (await Promise.all(spacePromises)).filter(s => s !== null) as Space[];
      setUserSpaces(spaceList);
      setLoading(false);
    });

    return () => {
      unsubProfile();
      unsubSpaces();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#081416] text-white animate-in fade-in duration-500 pb-32">
      <header className="flex justify-between items-center px-6 py-4">
        <button className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors">
          <span className="material-symbols-outlined text-2xl">settings</span>
        </button>
        <button className="p-2 -mr-2 text-slate-400 hover:text-white transition-colors">
          <span className="material-symbols-outlined text-2xl">notifications</span>
        </button>
      </header>

      <section className="flex flex-col items-center px-6 mb-8">
        <div className="relative mb-4">
          <div 
            className="w-28 h-28 rounded-full border-2 border-white/5 bg-center bg-cover shadow-2xl overflow-hidden ring-4 ring-primary/10" 
            style={{ backgroundImage: `url(${profile?.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400'})` }}
          />
          <div className="absolute bottom-1 right-1 bg-primary w-8 h-8 rounded-full flex items-center justify-center border-4 border-[#081416]">
            <span className="material-symbols-outlined text-white text-base">edit</span>
          </div>
        </div>
        
        <h1 className="text-2xl font-black tracking-tight mb-2">{profile?.name || 'Alex Doe'}</h1>
        
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#0e2226] border border-primary/20 rounded-full mb-3">
          <div className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_#11b4d4]"></div>
          <span className="text-[10px] font-black text-primary uppercase tracking-widest">Mood: Reflective</span>
        </div>
        
        <p className="text-slate-500 text-[9px] font-bold uppercase tracking-[0.2em]">Joined 2023</p>
      </section>

      <div className="px-6 mb-8">
        <div className="relative overflow-hidden bg-white/5 border border-white/5 rounded-xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined text-xl filled">emoji_events</span>
          </div>
          <div>
            <h3 className="text-xs font-black text-white leading-tight uppercase">100th Entry Reached!</h3>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Building a wonderful habit.</p>
          </div>
        </div>
      </div>

      <section className="px-6 mb-10">
        <h2 className="text-lg font-black mb-4 uppercase tracking-tight">My Journey</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 relative h-28 bg-white/5 border border-white/5 rounded-xl p-5 flex flex-col justify-end">
            <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1">Entries Written</span>
            <span className="text-3xl font-black text-primary leading-none">42</span>
          </div>
          <div className="h-24 bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col justify-end">
            <span className="text-xl font-black text-white">15</span>
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-0.5">Quotes</span>
          </div>
          <div className="h-24 bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col justify-end">
            <span className="text-xl font-black text-white">{profile?.totalStars || 88}</span>
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-0.5">Stars</span>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <div className="flex items-center justify-between px-6 mb-4">
          <h2 className="text-lg font-black uppercase tracking-tight">Your Spaces</h2>
          <button onClick={() => onNavigate('spaces')} className="text-[9px] font-black text-primary uppercase tracking-widest">All</button>
        </div>
        
        <div className="flex gap-3 overflow-x-auto no-scrollbar px-6">
          {userSpaces.map((space, idx) => (
            <div 
              key={space.id} 
              className="min-w-[200px] h-32 rounded-xl relative overflow-hidden bg-white/5 border border-white/5 p-4 flex flex-col justify-between"
            >
              <div>
                <span className="text-[8px] font-black text-primary uppercase tracking-widest mb-1 block">
                  {space.createdBy === auth.currentUser?.uid ? 'CREATED' : 'JOINED'}
                </span>
                <h3 className="text-sm font-black text-white uppercase leading-tight line-clamp-2">{space.name}</h3>
              </div>
              <p className="text-[9px] text-slate-500 font-bold uppercase">24 members</p>
            </div>
          ))}
        </div>
      </section>

      <div className="px-6">
        <button 
          onClick={handleLogout}
          className="w-full h-12 bg-red-500/10 border border-red-500/10 text-red-500 rounded-xl font-black uppercase tracking-widest text-[9px]"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default UserProfile;
