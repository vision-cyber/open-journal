
import React, { useState, useEffect } from 'react';
import { Journal, View, Space } from './types';
import { auth, db } from './services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { createJournal } from './services/journalService';
import DiscoverView from './components/DiscoverView';
import PostDetail from './components/PostDetail';
import WriteEntry from './components/WriteEntry';
import UserProfile from './components/UserProfile';
import ActivityFeed from './components/ActivityFeed';
import MyJournals from './components/MyJournals';
import SpacesTab from './components/SpacesTab';
import SpaceDetailView from './components/SpaceDetailView';
import Login from './components/Login';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeView, setActiveView] = useState<View>('discover');
  const [previousView, setPreviousView] = useState<View | null>(null);
  const [selectedPost, setSelectedPost] = useState<Journal | null>(null);
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handlePostClick = (post: Journal) => {
    setSelectedPost(post);
    setPreviousView(activeView); // Store where we came from
    setActiveView('detail');
  };

  const handleOpenSpace = (space: Space) => {
    setSelectedSpace(space);
    setActiveView('space_detail');
  };

  const handleBackFromDetail = () => {
    if (previousView === 'space_detail' && selectedSpace) {
      setActiveView('space_detail');
    } else if (previousView === 'journal') {
      setActiveView('journal');
    } else if (previousView === 'activity') {
      setActiveView('activity');
    } else {
      setActiveView('discover');
    }
    setPreviousView(null);
  };

  const handleSaveEntry = async (data: Partial<Journal>) => {
    try {
      await createJournal(data);
      // Redirect to discover so the user sees their post in the feed immediately
      setActiveView('discover');
    } catch (err) {
      console.error(err);
      alert("Failed to save.");
    }
  };

  if (authLoading) return <div className="min-h-screen bg-background-dark flex items-center justify-center text-primary font-black uppercase text-[10px] tracking-widest">Initializing...</div>;
  if (!currentUser) return <Login />;

  const showNav = !['write', 'edit', 'detail'].includes(activeView);

  return (
    <div className="relative flex h-full min-h-screen w-full flex-col overflow-x-hidden max-w-md mx-auto border-x border-slate-200 dark:border-slate-800 bg-background-light dark:bg-background-dark shadow-2xl">
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {activeView === 'discover' && <DiscoverView onPostClick={handlePostClick} />}
        {activeView === 'detail' && selectedPost && (
          <PostDetail post={selectedPost} onBack={handleBackFromDetail} />
        )}
        {activeView === 'write' && <WriteEntry onClose={() => setActiveView('discover')} onSave={handleSaveEntry} />}
        {activeView === 'journal' && <MyJournals onEntryClick={handlePostClick} />}
        {activeView === 'spaces' && <SpacesTab onOpenSpace={handleOpenSpace} />}
        {activeView === 'space_detail' && selectedSpace && (
          <SpaceDetailView 
            space={selectedSpace} 
            onBack={() => {
              setSelectedSpace(null);
              setActiveView('spaces');
            }} 
            onPostClick={handlePostClick}
            onWrite={() => {
              setActiveView('write');
            }}
          />
        )}
        {activeView === 'profile' && <UserProfile onNavigate={setActiveView} />}
        {activeView === 'activity' && <ActivityFeed onNavigateToPost={handlePostClick} />}
      </div>

      {/* FAB - Available in discover and journal view */}
      {(activeView === 'discover' || activeView === 'journal') && (
        <button 
          onClick={() => setActiveView('write')} 
          className="fixed bottom-28 right-6 h-14 w-14 bg-primary hover:scale-110 active:scale-95 rounded-2xl shadow-2xl flex items-center justify-center text-white transition-all z-40"
        >
          <span className="material-symbols-outlined text-2xl font-black">add</span>
        </button>
      )}

      {showNav && (
        <nav className="fixed bottom-0 w-full max-w-md bg-white/80 dark:bg-background-dark/95 backdrop-blur-2xl border-t border-slate-200 dark:border-white/5 pb-8 pt-4 px-2 z-50">
          <div className="flex justify-around items-center">
            {[
              { id: 'journal', icon: 'book_2', label: 'Journal' },
              { id: 'spaces', icon: 'hub', label: 'Hubs' },
              { id: 'discover', icon: 'explore', label: 'Home' },
              { id: 'activity', icon: 'notifications', label: 'Flow' },
              { id: 'profile', icon: 'person', label: 'Identity' }
            ].map(tab => {
              const isActive = activeView === tab.id || (tab.id === 'spaces' && activeView === 'space_detail');
              return (
                <button key={tab.id} onClick={() => {
                  setSelectedSpace(null);
                  setActiveView(tab.id as View);
                }} className={`flex flex-col items-center gap-1 w-16 transition-all ${isActive ? 'text-primary' : 'text-slate-400'}`}>
                  <span className={`material-symbols-outlined text-2xl ${isActive ? 'filled' : ''}`}>{tab.icon}</span>
                  <span className="text-[9px] font-black uppercase tracking-tight">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
};

export default App;
