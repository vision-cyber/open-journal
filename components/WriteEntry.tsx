
import React, { useState, useEffect, useRef } from 'react';
import { generateDailyPrompt, suggestTags, generateCoverImage } from '../services/geminiService';
import { Journal, Visibility, Space, Mood } from '../types';
import { db, auth } from '../services/firebase';
import { collection, query, where, doc, getDoc, onSnapshot } from 'firebase/firestore';

interface WriteEntryProps {
  onClose: () => void;
  onSave: (post: Partial<Journal>) => Promise<void>;
  editingPost?: Journal;
  initialSpaceId?: string | null;
}

const WriteEntry: React.FC<WriteEntryProps> = ({ onClose, onSave, editingPost, initialSpaceId }) => {
  const [title, setTitle] = useState(editingPost?.title || '');
  const [visibility, setVisibility] = useState<Visibility>(editingPost?.visibility || (initialSpaceId ? 'space' : 'private'));
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(editingPost?.spaceId || initialSpaceId || null);
  const [dailyPrompt, setDailyPrompt] = useState<string>('');
  const [showPrompt, setShowPrompt] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  
  const [tags, setTags] = useState<string[]>(editingPost?.tags || []);
  const [tagInput, setTagInput] = useState('');
  
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [showSpacePicker, setShowSpacePicker] = useState(false);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editorRef.current && !editorRef.current.innerHTML && editingPost?.content) {
      editorRef.current.innerHTML = editingPost.content;
    }

    const fetchPrompt = async () => {
      const p = await generateDailyPrompt();
      setDailyPrompt(p);
    };
    fetchPrompt();

    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const q = query(collection(db, "userSpaces"), where("userId", "==", user.uid));
      const unsub = onSnapshot(q, async (snap) => {
        const promises = snap.docs.map(async (d) => {
          const sdoc = await getDoc(doc(db, "spaces", d.data().spaceId));
          return sdoc.exists() ? ({ id: sdoc.id, ...sdoc.data() } as Space) : null;
        });
        const list = (await Promise.all(promises)).filter(s => s !== null) as Space[];
        setSpaces(list);
      });
      return () => unsub();
    };
    fetchUserData();
  }, [editingPost]);

  const insertImageAtCursor = (url: string, caption?: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
      const imgHtml = `
        <div class="my-6 block-image animate-in fade-in zoom-in duration-500 select-none">
          <img src="${url}" class="w-full rounded-md border border-white/5 shadow-2xl transition-transform hover:scale-[1.01]" alt="Visual" />
          ${caption ? `<p class="text-[8px] text-slate-600 mt-2 uppercase font-black tracking-widest text-center">${caption}</p>` : ''}
        </div>
        <p><br></p>
      `;
      document.execCommand('insertHTML', false, imgHtml);
    }
  };

  const generateAIImage = async () => {
    const text = editorRef.current?.innerText || "";
    if (!text) return;
    
    setIsGeneratingImage(true);
    const imageUrl = await generateCoverImage(title || "Reflection", text);
    setIsGeneratingImage(false);

    if (imageUrl) {
      insertImageAtCursor(imageUrl, "AI Interpretation");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        insertImageAtCursor(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    // Reset input for same file upload
    e.target.value = '';
  };

  const handleAddTag = (e?: React.KeyboardEvent) => {
    if (e && e.key !== 'Enter') return;
    if (!tagInput.trim()) return;
    const cleanTag = tagInput.trim().replace('#', '');
    if (!tags.includes(cleanTag)) {
      setTags([...tags, cleanTag]);
    }
    setTagInput('');
    if (e) e.preventDefault();
  };

  const handleAISuggestTags = async () => {
    const text = editorRef.current?.innerText || "";
    if (!text) return;
    const suggestions = await suggestTags(text);
    const newTags = Array.from(new Set([...tags, ...suggestions])).slice(0, 5);
    setTags(newTags);
  };

  const handleSave = async () => {
    const content = editorRef.current?.innerHTML || "";
    if (!content.replace(/<[^>]*>/g, '').trim()) return;
    
    // Extract first image for preview if possible
    const imgMatch = content.match(/<img [^>]*src="([^"]+)"/);
    const firstImageUrl = imgMatch ? imgMatch[1] : null;

    setIsSaving(true);
    try {
      await onSave({ 
        title: title || "Untitled Reflection", 
        content, 
        excerpt: editorRef.current?.innerText.substring(0, 150) + "...",
        visibility: selectedSpaceId ? 'space' : visibility, 
        tags,
        imageUrl: firstImageUrl, // Use first inline image as cover
        spaceId: selectedSpaceId,
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
    <div className="fixed inset-0 z-[100] bg-[#081416] text-white flex flex-col font-display overflow-hidden animate-in fade-in slide-in-from-bottom duration-300">
      <header className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-white/5 bg-[#081416]/95 backdrop-blur-md">
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
          <span className="material-symbols-outlined text-xl">close</span>
        </button>
        <div className="flex items-center gap-4">
           {isGeneratingImage && <span className="text-[8px] font-black uppercase text-primary animate-pulse tracking-widest">Generating...</span>}
           <button 
            onClick={handleSave} 
            disabled={isSaving} 
            className="text-primary text-sm font-black uppercase tracking-widest hover:opacity-80 disabled:opacity-30 transition-all"
          >
            {isSaving ? 'Saving' : 'Save'}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar pb-20">
        <div className="max-w-xl mx-auto px-4 pt-4 space-y-6">
          
          <div className="grid grid-cols-2 gap-2">
            <div className="flex p-1 bg-[#112124] rounded-lg border border-white/5">
              <button 
                onClick={() => { setVisibility('private'); setSelectedSpaceId(null); }}
                className={`flex-1 h-8 rounded text-[9px] font-black uppercase tracking-widest transition-all ${visibility === 'private' && !selectedSpaceId ? 'bg-[#1a2c2f] text-white shadow' : 'text-slate-500'}`}
              >
                Private
              </button>
              <button 
                onClick={() => { setVisibility('public'); setSelectedSpaceId(null); }}
                className={`flex-1 h-8 rounded text-[9px] font-black uppercase tracking-widest transition-all ${visibility === 'public' && !selectedSpaceId ? 'bg-[#1a2c2f] text-white shadow' : 'text-slate-500'}`}
              >
                Public
              </button>
            </div>

            <div className="relative">
              <button 
                onClick={() => setShowSpacePicker(!showSpacePicker)}
                className="w-full h-10 bg-[#112124] px-3 rounded-lg flex items-center justify-between border border-white/5 transition-all"
              >
                <span className={`text-[9px] font-black uppercase tracking-widest truncate ${selectedSpaceId ? 'text-primary' : 'text-slate-500'}`}>
                  {selectedSpaceId ? spaces.find(s => s.id === selectedSpaceId)?.name : 'Post to Hub'}
                </span>
                <span className="material-symbols-outlined text-slate-600 text-xs">expand_more</span>
              </button>
              {showSpacePicker && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-[#112124] border border-white/10 rounded-lg overflow-hidden z-50 shadow-2xl animate-in fade-in slide-in-from-top-1">
                  <button onClick={() => { setSelectedSpaceId(null); setVisibility('private'); setShowSpacePicker(false); }} className="w-full px-4 py-3 text-left text-[9px] font-black uppercase tracking-widest text-slate-500 hover:bg-white/5 border-b border-white/5">Personal Journal</button>
                  {spaces.map(space => (
                    <button key={space.id} onClick={() => { setSelectedSpaceId(space.id); setVisibility('space'); setShowSpacePicker(false); }} className="w-full px-4 py-3 text-left text-[9px] font-black uppercase tracking-widest hover:bg-white/5 border-b border-white/5 last:border-none flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-primary/10 flex items-center justify-center text-primary text-[7px]">{space.name.charAt(0)}</div>
                      {space.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {showPrompt && dailyPrompt && (
            <div className="bg-[#112124] border border-white/5 rounded-lg p-3 relative">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-amber-400 text-sm filled">sunny</span>
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Prompt</span>
                <button onClick={() => setShowPrompt(false)} className="absolute top-2 right-2 material-symbols-outlined text-xs text-slate-700">close</button>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed font-light italic">"{dailyPrompt}"</p>
            </div>
          )}

          <div className="space-y-4">
            <input 
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="ENTRY TITLE"
              className="w-full bg-transparent border-none p-0 text-2xl font-black text-white placeholder:text-slate-800 focus:ring-0 uppercase tracking-tight"
            />
            
            <div 
              ref={editorRef}
              contentEditable
              className="w-full bg-transparent border-none p-0 text-base font-light text-slate-300 focus:ring-0 min-h-[300px] outline-none leading-relaxed prose prose-invert max-w-none"
            />
          </div>
        </div>
      </main>

      {/* Fixed Tag Section */}
      <div className="border-t border-white/5 bg-[#081416] px-4 py-3">
        <div className="max-w-xl mx-auto space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 font-bold text-xs">#</span>
              <input 
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="ADD TAG"
                className="w-full h-9 pl-6 pr-3 bg-white/5 border border-white/5 rounded-lg text-[10px] font-black uppercase tracking-widest placeholder:text-slate-700 focus:ring-primary focus:border-primary"
              />
            </div>
            <button 
              onClick={handleAISuggestTags}
              className="h-9 px-3 bg-primary/10 border border-primary/20 text-primary text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-primary/20 transition-all flex items-center gap-1.5 shrink-0"
            >
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              AI
            </button>
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag, i) => (
                <span key={i} className="px-2 py-1 bg-white/5 border border-white/10 text-slate-500 text-[9px] font-black uppercase tracking-widest rounded flex items-center gap-1.5">
                  #{tag}
                  <button onClick={() => setTags(tags.filter((_, idx) => idx !== i))} className="material-symbols-outlined text-[10px] text-slate-700 hover:text-red-500">close</button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Magic Toolbar */}
      <div className="bg-[#081416] p-3 border-t border-white/5">
        <div className="max-w-md mx-auto h-12 bg-[#112124] border border-white/10 rounded-xl shadow-2xl flex items-center justify-around px-4">
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-0.5 text-slate-500 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-lg">add_photo_alternate</span>
            <span className="text-[6px] font-black uppercase tracking-[0.2em]">Upload</span>
          </button>

          <button 
            onClick={generateAIImage}
            disabled={isGeneratingImage}
            className="flex flex-col items-center gap-0.5 text-slate-500 hover:text-primary transition-colors disabled:opacity-20"
          >
            <span className="material-symbols-outlined text-lg">auto_videocam</span>
            <span className="text-[6px] font-black uppercase tracking-[0.2em]">AI Visual</span>
          </button>
          
          <div className="w-[1px] h-6 bg-white/10"></div>

          <button onClick={() => document.execCommand('bold', false)} className="text-slate-500 hover:text-white"><span className="material-symbols-outlined text-lg">format_bold</span></button>
          <button onClick={() => document.execCommand('italic', false)} className="text-slate-500 hover:text-white"><span className="material-symbols-outlined text-lg">format_italic</span></button>
          <button onClick={() => document.execCommand('insertUnorderedList', false)} className="text-slate-500 hover:text-white"><span className="material-symbols-outlined text-lg">format_list_bulleted</span></button>
        </div>
      </div>
    </div>
  );
};

export default WriteEntry;
