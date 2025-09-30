import type { Timestamp } from 'firebase/firestore';

export interface BoardPost {
  id: string;
  no: number;
  title: string;
  content: string;
  author: string;
  authorUid: string | null;
  authorPosition?: string | null;
  authorExp?: number | null;
  isAnonymous: boolean;
  views: number;
  likes: number;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
  locked?: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  author: string;
  authorPosition?: string | null;
  authorExp?: number | null;
  authorUid: string | null;
  content: string;
  body?: string;
  isAnonymous: boolean;
  createdAt: Timestamp;
  likes: number;
  likedByUsers: string[];
  password?: string;
  parentId?: string;
  repliesCount?: number;
}

export type AddCommentInput = Omit<Comment, 'id' | 'createdAt' | 'likes'>;

export interface Staff {
  id: string;
  name: string;
}
