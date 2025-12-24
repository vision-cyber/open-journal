
import React, { useState, useEffect } from 'react';
import { Space, UserProfileData } from '../types';
import { db, auth } from '../services/firebase';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { joinSpaceByCode, createSpace } from '../services/journalService';

const STAR_GOAL = 50;
const generateRandomCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

interface SpacesTabProps {
  onOpenSpace: (space: Space) => void;
}

const SpacesTab: React.FC<SpacesTabProps> = ({ onOpenSpace }) => {
  const [joinedSpaces, setJoinedSpaces] = useState<Space[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [showJoinFlow, setShowJoinFlow] = useState(false);
  const [showCreateFlow, setShowCreateFlow] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newInviteCode, setNewInviteCode] = useState(generateRandomCode());
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const userUnsub = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) setUserProfile(docSnap.data() as UserProfileData);
    });

    const q = query(collection(db, "userSpaces"), where("userId", "==", user.uid));
    const spacesUnsub = onSnapshot(q, async (snapshot) => {
      const spacePromises = snapshot.docs.map(async (d) => {
        const sid = d.data().spaceId;
        const sdoc = await getDoc(doc(db, "spaces", sid));
        return sdoc.exists() ? ({ id: sdoc.id, ...sdoc.data() } as Space) : null;
      });
      const spaceList = (await Promise.all(spacePromises)).filter(s => s !== null) as Space[];
      setJoinedSpaces(spaceList);
      setLoading(false);
    });

    return () => { userUnsub(); spacesUnsub(); };
  }, []);

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    try {
      await joinSpaceByCode(joinCode.trim().toUpperCase());
      setJoinCode('');
      setShowJoinFlow(false);
    } catch (err) { setError('Invalid code.'); }
  };

  const handleCreate = async () => {
    if (!newName.trim() || !newDescription.trim()) return;
    try {
      await createSpace(newName.trim(), newDescription.trim(), newInviteCode);
      setShowCreateFlow(false);
    } catch (err) { setError('Failed.'); }
  };

  const stars = userProfile?.totalStars || 0;
  const isUnlocked = stars >= STAR_GOAL;

  if (showCreateFlow) {
    return (
      <div className="fixed inset-0 z-[120] bg-[#0d1618] text-white flex flex-col p-6 animate-in slide-in-from-bottom duration-300">
        <header className="flex justify-between items-center mb-8">
          <button onClick={() => setShowCreateFlow(false)} className="material-symbols-outlined">close</button>
          <h2 className="text-xs font-black uppercase tracking-widest">Setup Space</h2>
          <div className="w-6"></div>
        </header>
        <div className="space-y-6">
          <input 
            type="text" placeholder="Space Name" value={newName} onChange={e => setNewName(e.target.value)}
            className="w-full h-12 bg-white/5 border border-white/5 rounded-lg px-4 text-sm focus:ring-1 focus:ring-primary"
          />
          <textarea 
            placeholder="Mission" value={newDescription} onChange={e => setNewDescription(e.target.value)}
            className="w-full bg-white/5 border border-white/5 rounded-lg px-4 py-3 text-sm focus:ring-1 focus:ring-primary h-24"
          />
          <button onClick={handleCreate} className="w-full h-12 bg-primary text-white font-black rounded-lg uppercase text-xs tracking-widest">Establish Hub</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0d1618]">
      <header className="px-4 pt-10 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-black text-white uppercase">Hubs</h1>
          <button 
            onClick={() => setShowJoinFlow(true)}
            className="px-3 py-1.5 bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest rounded-md border border-primary/20"
          >
            Connect Hub
          </button>
        </div>
        <div className="p-3 bg-white/5 border border-white/5 rounded-lg flex items-center justify-between">
           <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Architect Access</span>
              <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                 <div className="h-full bg-primary" style={{ width: `${(stars/STAR_GOAL)*100}%` }}></div>
              </div>
           </div>
           {isUnlocked && (
             <button onClick={() => setShowCreateFlow(true)} className="text-[9px] font-black text-primary uppercase tracking-widest">+ New Space</button>
           )}
        </div>
      </header>

      <main className="px-4 space-y-3 pb-32">
        {loading ? (
          <div className="py-20 text-center animate-pulse text-slate-600 font-black uppercase text-[10px]">Syncing...</div>
        ) : joinedSpaces.map(space => (
          <div 
            key={space.id} onClick={() => onOpenSpace(space)}
            className="p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/[0.08] transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">hub</span>
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-tight">{space.name}</h3>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">ID: {space.inviteCode}</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-slate-600 group-hover:text-primary transition-colors">arrow_forward</span>
            </div>
            <p className="text-xs text-slate-500 font-light line-clamp-1 italic">"{space.description}"</p>
          </div>
        ))}
        {joinedSpaces.length === 0 && !loading && (
          <div className="py-20 text-center opacity-20">
            <p className="text-[10px] font-black uppercase tracking-widest">Empty Orbit</p>
          </div>
        )}
      </main>

      {showJoinFlow && (
        <div className="fixed inset-0 z-[120] bg-[#0d1618] p-8 flex flex-col justify-center animate-in slide-in-from-right">
          <button onClick={() => setShowJoinFlow(false)} className="absolute top-8 left-8 material-symbols-outlined text-slate-500">arrow_back</button>
          <div className="text-center space-y-6">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">Connect Hub</h2>
            <input 
              type="text" placeholder="XXXXXX" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
              className="w-full h-16 bg-white/5 border-none rounded-lg text-center text-4xl font-black tracking-widest focus:ring-1 focus:ring-primary"
            />
            <button onClick={handleJoin} className="w-full h-12 bg-primary text-white font-black rounded-lg uppercase text-xs tracking-widest">Initiate Access</button>
            {error && <p className="text-red-500 text-[9px] font-black uppercase">{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default SpacesTab;
