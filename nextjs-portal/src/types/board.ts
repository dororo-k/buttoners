export interface BoardPost {
  id: string;
  no: number;
  title: string;
  content: string;
  author: string;
  isAnonymous: boolean;
  commentsCount: number;
  views: number;
  likes: number;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  locked?: boolean;
}

