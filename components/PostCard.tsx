
import React from 'react';
import { Journal } from '../types';

interface PostCardProps {
  post: Journal;
  onClick: (post: Journal) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onClick }) => {
  const hasImage = !!post.imageUrl;

  const TagsList = () => (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {post.tags?.map((tag, i) => (
        <span key={i} className="text-[9px] font-black text-primary/50 uppercase tracking-widest">
          #{tag.replace('#', '')}
        </span>
      ))}
    </div>
  );

  const displayTime = typeof post.createdAt === 'string' 
    ? post.createdAt 
    : (post.createdAt?.toMillis ? new Date(post.createdAt.toMillis()).toLocaleDateString() : 'Recent');

  if (hasImage) {
    return (
      <article 
        className="group flex flex-col bg-surface-light dark:bg-surface-dark rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 border border-slate-200 dark:border-white/5 cursor-pointer"
        onClick={() => onClick(post)}
      >
        <div 
          className="relative h-40 bg-cover bg-center" 
          style={{ 
            backgroundImage: `linear-gradient(0deg, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0) 100%), url("${post.imageUrl}")` 
          }}
        >
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase bg-white/10 backdrop-blur-sm text-white border border-white/20">
              {post.mood}
            </span>
          </div>
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="text-white text-base font-black leading-tight mb-1">{post.title}</h3>
            <div className="flex items-center gap-2">
              <span className="text-slate-300 text-[10px] font-bold uppercase tracking-tight">{post.authorHandle}</span>
            </div>
          </div>
        </div>
        <div className="p-4 flex flex-col gap-2">
          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed line-clamp-2 font-light">
            {post.excerpt}
          </p>
          <div className="flex items-center justify-between mt-1">
            <TagsList />
            <span className="text-[10px] text-slate-500 font-bold uppercase">{displayTime}</span>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article 
      className="group flex flex-col bg-surface-light dark:bg-surface-dark rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 border border-slate-200 dark:border-white/5 p-4 cursor-pointer"
      onClick={() => onClick(post)}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary font-black uppercase text-[10px]">
            {post.authorName?.charAt(0) || 'U'}
          </div>
          <div className="flex flex-col">
            <span className="text-slate-900 dark:text-white text-xs font-black uppercase tracking-tight">{post.authorHandle}</span>
            <span className="text-[9px] text-slate-500 font-bold">{displayTime}</span>
          </div>
        </div>
        {post.mood && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500">
            {post.mood}
          </span>
        )}
      </div>
      <h3 className="text-base font-black mb-1.5 dark:text-white">{post.title}</h3>
      <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-3 line-clamp-3 font-light">
        {post.excerpt}
      </p>
      <TagsList />
    </article>
  );
};

export default PostCard;
