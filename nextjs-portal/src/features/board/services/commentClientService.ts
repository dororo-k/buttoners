import { db } from '@/lib/firebaseClient';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import type { Comment } from '../types';

// 댓글 실시간 구독
export function getCommentsSubscription(
  postId: string,
  callback: (comments: Comment[]) => void
): () => void {
  const commentsCol = collection(db, 'boards', postId, 'comments');
  const q = query(commentsCol, orderBy('createdAt', 'asc'));
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        postId: data.postId,
        author: data.author,
        authorUid: data.authorUid,
        content: data.content,
        createdAt: data.createdAt,
        likes: data.likes,
        likedByUsers: data.likedByUsers || [],
        isAnonymous: data.isAnonymous,
        parentId: data.parentId,
      } as Comment;
    });
    callback(comments);
  });
  return unsubscribe;
}
