
import { Timestamp } from 'firebase/firestore';

export type Mood = 'Hopeful' | 'Calm' | 'Excited' | 'Anxious' | 'Overwhelmed' | 'Melancholy' | 'Grateful';
export type Visibility = 'public' | 'private' | 'space';

export interface UserProfileData {
  uid: string;
  email: string;
  handle: string;
  name: string;
  totalStars: number;
  canCreateSpace: boolean;
  joinedAt: any;
  avatarUrl?: string;
}

export interface Note {
  id: string;
  userId: string;
  authorName: string;
  authorHandle: string;
  content: string;
  starred: boolean;
  createdAt: any;
}

export interface Journal {
  id: string;
  userId: string;
  authorName: string;
  authorHandle: string;
  title: string;
  content: string;
  excerpt: string;
  mood?: Mood;
  visibility: Visibility;
  spaceId?: string | null;
  tags: string[];
  imageUrl?: string;
  createdAt: any;
  updatedAt: any;
}

export interface Space {
  id: string;
  name: string;
  description: string;
  inviteCode: string;
  createdBy: string;
  createdAt: any;
  memberCount?: number;
  activity?: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: 'note' | 'star' | 'milestone';
  fromUserId: string;
  fromUserName: string;
  journalId: string;
  noteId?: string;
  createdAt: any;
  read: boolean;
}

export type View = 'discover' | 'journal' | 'profile' | 'detail' | 'write' | 'activity' | 'spaces' | 'edit' | 'space_detail' | 'space_perspective';
