export interface Notice {
  id: string;
  no: number;
  title: string;
  body: string;
  authorUid?: string; // Added
  authorName?: string;
  viewCount: number;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

