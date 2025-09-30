import { doc, runTransaction, arrayUnion, arrayRemove } from 'firebase/firestore';
import type { Comment } from '../types';
import { db } from '@/lib/firebaseClient'; // Firestore 인스턴스 경로

/**
 * 특정 댓글에 대한 사용자의 '좋아요' 상태를 토글합니다.
 * @param postId 댓글이 포함된 게시물의 ID
 * @param commentId '좋아요'를 누를 댓글의 ID
 * @param userId 작업을 수행하는 사용자의 ID
 */
export async function toggleCommentLike(postId: string, commentId: string, userId: string) {
  // 특정 댓글 문서에 대한 참조를 생성합니다.
  const commentRef = doc(db, 'posts', postId, 'comments', commentId);

  // 트랜잭션을 사용하여 데이터의 일관성을 보장하며 읽기/쓰기 작업을 수행합니다.
  await runTransaction(db, async (transaction) => {
    const commentDoc = await transaction.get(commentRef);
    if (!commentDoc.exists()) {
      throw new Error("댓글이 존재하지 않습니다.");
    }

    const commentData = commentDoc.data();
    const likedBy = commentData.likedBy || [];
    const hasLiked = likedBy.includes(userId);

    if (hasLiked) {
      // 이미 '좋아요'를 눌렀다면, 사용자 ID를 배열에서 제거하고 '좋아요' 수를 1 감소시킵니다.
      transaction.update(commentRef, {
        likedBy: arrayRemove(userId),
        likes: (commentData.likes || 1) - 1
      });
    } else {
      // '좋아요'를 누르지 않았다면, 사용자 ID를 배열에 추가하고 '좋아요' 수를 1 증가시킵니다.
      transaction.update(commentRef, {
        likedBy: arrayUnion(userId),
        likes: (commentData.likes || 0) + 1
      });
    }
  });
}

export const commentRepo = { toggleCommentLike };
