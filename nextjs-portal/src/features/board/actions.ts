'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getAuthenticatedUser, AuthenticatedUser } from '@/lib/session';
import { db } from '@/lib/firebaseAdmin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { BoardPost, Comment } from './types';


// --- 에러 처리 헬퍼 ---
class AuthError extends Error {
  constructor(message = '인증이 필요합니다.') {
    super(message);
    this.name = 'AuthError';
  }
}

class PermissionError extends Error {
  constructor(message = '권한이 없습니다.') {
    super(message);
    this.name = 'PermissionError';
  }
}

// --- 게시물 추가 액션 ---
export async function addPostAction(prevState: any, formData: FormData): Promise<{ message: string }> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      throw new AuthError();
    }

    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const isAnonymous = formData.get('isAnonymous') === 'on';

    if (!title || !content) {
      return { message: '제목과 내용은 필수입니다.' };
    }

    const newPostData: Omit<BoardPost, 'id' | 'no' | 'views' | 'likes' | 'commentsCount' | 'createdAt' | 'updatedAt'> = {
      title,
      content,
      author: isAnonymous ? '익명' : user.nickname,
      authorUid: isAnonymous ? null : user.uid,
      authorPosition: isAnonymous ? null : user.position,
      authorExp: isAnonymous ? null : user.exp,
      isAnonymous: isAnonymous,
    };

    await addBoardPostServerAction(newPostData); // Call the new server action

  } catch (error) {
    console.error('addPostAction Error:', error);
    if (error instanceof AuthError) {
      return { message: '로그인이 필요합니다.' };
    }
    return { message: '게시물 작성 중 오류가 발생했습니다.' };
  }

  revalidatePath('/board');
  redirect('/board');
  return { message: 'success' };
}

// --- 게시물 삭제 액션 ---
export async function deletePostAction(postId: string, formData: FormData) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      throw new AuthError('로그인이 필요합니다.');
    }

    const postRef = db.collection('boards').doc(postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
      throw new Error('게시물이 존재하지 않습니다.');
    }

    const postData = postDoc.data() as BoardPost;

    if (postData.isAnonymous) {
      throw new PermissionError('익명 게시물은 삭제할 수 없습니다.');
    }

    // 관리자 또는 본인만 삭제 가능
    if (user.position !== 'admin' && postData.authorUid !== user.uid) {
      throw new PermissionError('이 게시물을 삭제할 권한이 없습니다.');
    }

    // Log the post ID before deletion
    console.log(`Attempting to delete post with ID: ${postId}`);
    await postRef.delete();
    console.log(`Post with ID: ${postId} successfully deleted.`);
  } catch (error: any) {
    console.error('deletePostAction Error:', error);
    // 에러를 다시 던져 Next.js의 에러 처리 메커니즘에 맡깁니다.
    throw error;
  }

  revalidatePath('/board');
  redirect('/board');
}

// --- 게시물 수정 액션 ---
export async function updatePostAction(postId: string, prevState: any, formData: FormData): Promise<{ message: string }> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) throw new AuthError();

    const postRef = db.collection('boards').doc(postId);
    const postDoc = await postRef.get();
    if (!postDoc.exists) throw new Error('게시물이 존재하지 않습니다.');

    const postData = postDoc.data() as BoardPost;
    if (postData.isAnonymous) {
      throw new PermissionError('익명 게시물은 수정할 수 없습니다.');
    }
    if (user.position !== 'admin' && postData.authorUid !== user.uid) {
      throw new PermissionError('이 게시물을 수정할 권한이 없습니다.');
    }

    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    if (!title || !content) {
      return { message: '제목과 내용은 필수입니다.' };
    }

    await postRef.update({
      title,
      content,
      updatedAt: Timestamp.now(),
    });

  } catch (error) {
    console.error('updatePostAction Error:', error);
    if (error instanceof AuthError || error instanceof PermissionError) {
      return { message: error.message };
    }
    return { message: '게시물 수정 중 오류가 발생했습니다.' };
  }

  revalidatePath('/board');
  // 상세 페이지도 revalidate 해야 하지만, no를 모르므로 경로 전체를 revalidate
  revalidatePath('/board/[no]', 'layout');
  return { message: 'success' };
}

// --- 댓글 추가 액션 ---
export async function addCommentAction(postId: string, parentId: string | null, formData: FormData): Promise<{ message: string }> {
  // Add this check
  if (!(formData instanceof FormData)) {
    console.error('addCommentAction: Received formData is not an instance of FormData:', formData);
    return { message: '폼 데이터가 올바르지 않습니다. 개발자에게 문의하세요.' };
  }

  console.log('addCommentAction received formData:', formData);
  console.log('Type of formData:', typeof formData);
  console.log('Does formData have .get method?', typeof (formData as any).get === 'function');

  let user;
  try {
    user = await getAuthenticatedUser();
    if (!user) throw new AuthError();
  } catch (authError) {
    console.error('addCommentAction - Authentication Error:', authError);
    return { message: '로그인이 필요합니다.' };
  }

  // Explicitly re-fetch user data to ensure latest exp/position
  const freshUserDoc = await db.collection('users').doc(user.uid).get();
  if (!freshUserDoc.exists) {
    console.error('addCommentAction: User document not found after authentication for uid:', user.uid);
    return { message: '사용자 정보를 찾을 수 없습니다.' };
  }
  const freshUserData = freshUserDoc.data()!;
  const freshUser: AuthenticatedUser = {
    ...user, // Keep existing fields like email, name, nickname
    position: freshUserData.position || 'buttoner',
    points: freshUserData.points || 0,
    exp: freshUserData.exp || 0,
    favorites: freshUserData.favorites || [],
  };

  const content = formData.get('content') as string;
  const isAnonymous = formData.get('isAnonymous') === 'on';
  if (!content || !content.trim()) {
    return { message: '댓글 내용이 필요합니다.' };
  }

  console.log('addCommentAction: Fresh User:', freshUser); // Log fresh user data
  const commentData = {
    postId: postId,
    author: isAnonymous ? '익명' : freshUser.nickname,
    authorUid: isAnonymous ? null : freshUser.uid,
    authorPosition: isAnonymous ? null : freshUser.position, // Use fresh user data
    authorExp: isAnonymous ? null : freshUser.exp,         // Use fresh user data
    content: content.trim(),
    isAnonymous: isAnonymous,
    createdAt: Timestamp.now(),
    likes: 0,
    likedByUsers: [],
    parentId: parentId,
  };
  console.log('addCommentAction: Preparing to write commentData:', commentData);

  try {
    await db.runTransaction(async (transaction) => {
      const commentRef = db.collection('boards').doc(postId).collection('comments').doc();
      const postRef = db.collection('boards').doc(postId);

      // postId 유효성 검사 (선택 사항이지만, 오류 방지에 도움)
      const postDoc = await transaction.get(postRef);
      if (!postDoc.exists) {
        throw new Error('게시물이 존재하지 않습니다. 유효하지 않은 postId입니다.');
      }

      transaction.set(commentRef, commentData); // Use commentData
      // 게시물 댓글 수 증가
      transaction.update(postRef, { commentsCount: FieldValue.increment(1) });
    });
  } catch (transactionError: any) { // Explicitly type as any for broader error handling
    console.error('addCommentAction - Transaction Error:', transactionError);
    console.error('Error Name:', transactionError.name);
    console.error('Error Message:', transactionError.message);
    // Return a more detailed message to the UI
    let errorMessage = '댓글 작성 중 데이터베이스 오류가 발생했습니다.';
    if (transactionError instanceof Error) {
      if (transactionError.message.includes('게시물이 존재하지 않습니다')) {
        errorMessage = '댓글을 작성하려는 게시물이 존재하지 않습니다.';
      } else if (transactionError.name === 'FirebaseError' || transactionError.name === 'FirestoreError') {
        // This is a common error name for security rule violations
        errorMessage = `Firestore 오류: ${transactionError.message}. 보안 규칙을 확인하세요.`;
      } else {
        errorMessage = `오류: ${transactionError.message}`;
      }
    }
    return { message: errorMessage };
  }

  revalidatePath(`/board/[no]`, 'page');
  return { message: 'success' };
}

// --- 댓글 수정 액션 ---
export async function updateCommentAction(commentId: string, postId: string, prevState: any, formData: FormData): Promise<{ message: string }> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) throw new AuthError();

    const content = formData.get('content') as string;
    if (!content || !content.trim()) {
      return { message: '댓글 내용이 필요합니다.' };
    }

    const commentRef = db.collection('boards').doc(postId).collection('comments').doc(commentId);
    const commentDoc = await commentRef.get();
    if (!commentDoc.exists) throw new Error('댓글이 존재하지 않습니다.');

    if (commentDoc.data()!.isAnonymous) {
      throw new PermissionError('익명 댓글은 수정할 수 없습니다.');
    }

    if (user.position !== 'admin' && commentDoc.data()!.authorUid !== user.uid) {
      throw new PermissionError('이 댓글을 수정할 권한이 없습니다.');
    }

    await commentRef.update({ content: content.trim() });

  } catch (error) {
    console.error('updateCommentAction Error:', error);
    if (error instanceof AuthError || error instanceof PermissionError) {
      return { message: error.message };
    }
    return { message: '댓글 수정 중 오류가 발생했습니다.' };
  }

  revalidatePath(`/board/[no]`, 'page');
  return { message: 'success' };
}

// --- 댓글 삭제 액션 ---
export async function deleteCommentAction(commentId: string, postId: string): Promise<{ message: string }> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) throw new AuthError();

    const commentRef = db.collection('boards').doc(postId).collection('comments').doc(commentId);
    const commentDoc = await commentRef.get();
    if (!commentDoc.exists) throw new Error('댓글이 존재하지 않습니다.');

    if (commentDoc.data()!.isAnonymous) {
      throw new PermissionError('익명 댓글은 삭제할 수 없습니다.');
    }

    if (user.position !== 'admin' && commentDoc.data()!.authorUid !== user.uid) {
      throw new PermissionError('이 댓글을 삭제할 권한이 없습니다.');
    }

    const postRef = db.collection('boards').doc(postId);
    await db.runTransaction(async (transaction) => {
      transaction.delete(commentRef);
      transaction.update(postRef, { commentsCount: FieldValue.increment(-1) });
    });

  } catch (error) {
    console.error('deleteCommentAction Error:', error);
    if (error instanceof AuthError || error instanceof PermissionError) {
      return { message: error.message };
    }
    return { message: '댓글 삭제 중 오류가 발생했습니다.' };
  }

  revalidatePath(`/board/[no]`, 'page');
  return { message: 'success' };
}

// --- 단일 게시물 조회 액션 (no 기준) ---
export async function getBoardPostByNoAction(no: number): Promise<BoardPost | null> {
  const postsRef = db.collection('boards');
  const q = postsRef.where('no', '==', no).limit(1);
  const postSnap = await q.get();
  if (postSnap.empty) {
    return null;
  }
  return { id: postSnap.docs[0].id, ...postSnap.docs[0].data()
  } as BoardPost;
}

// --- 게시물 목록 조회 액션 (무한 스크롤용) ---
export async function getBoardPostsOnceAction({ pageParam, query }: { pageParam?: number; query?: string }): Promise<{ posts: BoardPost[]; nextCursor: number | null }> {
  console.log('getBoardPostsOnceAction: Received pageParam:', pageParam, 'query:', query); // Log 1
  const postsRef = db.collection('boards');
  let q: FirebaseFirestore.Query = postsRef;

  if (query) {
    q = q.where('title', '>=', query).where('title', '<', query + '\uf8ff'); // Simple text search
  }

  q = q.orderBy('createdAt', 'desc'); // Order by creation date for infinite scroll

  if (pageParam) {
    const startAfterDoc = await postsRef.where('no', '==', pageParam).limit(1).get();
    if (!startAfterDoc.empty) {
      q = q.startAfter(startAfterDoc.docs[0]);
    }
  }

  q = q.limit(10); // Fetch 10 posts at a time

  const snapshot = await q.get();
  const posts: BoardPost[] = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as BoardPost[];

  const lastPostNo = posts.length > 0 ? posts[posts.length - 1].no : null;
  const nextCursor = snapshot.empty || posts.length < 10 ? null : lastPostNo;

  console.log('getBoardPostsOnceAction: Fetched', posts.length, 'posts.'); // Log 2
  if (posts.length > 0) {
    console.log('getBoardPostsOnceAction: First post no:', posts[0].no, 'Last post no:', posts[posts.length - 1].no); // Log 3
  }
  console.log('getBoardPostsOnceAction: Returning nextCursor:', nextCursor); // Log 4

  return { posts, nextCursor };
}

// --- 게시물 추가 핵심 로직 (Server Action) ---
export async function addBoardPostServerAction(
  post: Omit<BoardPost, 'id' | 'no' | 'views' | 'likes' | 'commentsCount' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const newPostRef = db.collection('boards').doc();
  const metaRef = db.collection('board_meta').doc('counter');

  await db.runTransaction(async (transaction) => {
    const metaDoc = await transaction.get(metaRef);
    const lastNo = metaDoc.exists ? metaDoc.data()!.lastNo : 0;
    const newNo = lastNo + 1;

    const postData = {
      ...post,
      no: newNo,
      views: 0,
      likes: 0,
      commentsCount: 0,
      createdAt: Timestamp.now().toDate().toISOString(), // Use Timestamp.now() for server-side
      updatedAt: Timestamp.now().toDate().toISOString(), // Use Timestamp.now() for server-side
    };
    console.log('addBoardPostServerAction: Preparing to set postData:', postData); // Log 1
    transaction.set(newPostRef, postData);
    console.log('addBoardPostServerAction: Post data set for newPostRef:', newPostRef.id); // Log 2
    transaction.update(metaRef, { lastNo: newNo });
    console.log('addBoardPostServerAction: Meta counter updated to:', newNo); // Log 3
  });
  console.log('addBoardPostServerAction: Transaction completed successfully.'); // Log 4
}

// --- 게시물 업데이트 핵심 로직 (Server Action) ---
export async function updateBoardPostServerAction(
  id: string,
  patch: Partial<Omit<BoardPost, 'id' | 'no' | 'views' | 'likes' | 'commentsCount' | 'createdAt'>>
) {
  const postRef = db.collection('boards').doc(id);
  await postRef.update({
    ...patch,
    updatedAt: Timestamp.now(),
  });
}

// --- 게시물 삭제 핵심 로직 (Server Action) ---
export async function deleteBoardPostServerAction(id: string) {
  const postRef = db.collection('boards').doc(id);
  await postRef.delete();
}

// --- 게시물 조회수 증가 핵심 로직 (Server Action) ---
export async function incrementBoardViewsAction(id: string) {
  const postRef = db.collection('boards').doc(id);
  await postRef.update({
    views: FieldValue.increment(1),
  });
}

// --- 댓글 추가 핵심 로직 (Server Action) ---
export async function addCommentServerAction(
  postId: string,
  comment: Omit<Comment, 'id' | 'createdAt' | 'likes'>
): Promise<Comment> {
  const commentsColRef = db.collection('boards').doc(postId).collection('comments');
  const newCommentRef = await commentsColRef.add({
    ...comment,
    createdAt: Timestamp.now(),
    likes: 0,
  });
  // 게시물 댓글 수 증가
  const postRef = db.collection('boards').doc(postId);
  await postRef.update({
    commentsCount: FieldValue.increment(1),
  });
  return { id: newCommentRef.id, ...comment, createdAt: Timestamp.now(), likes: 0 } as Comment;
}

// --- 댓글 업데이트 핵심 로직 (Server Action) ---
export async function updateCommentServerAction(
  postId: string,
  commentId: string,
  patch: Partial<Omit<Comment, 'id' | 'postId' | 'createdAt' | 'likes'>>
) {
  const commentRef = db.collection('boards').doc(postId).collection('comments').doc(commentId);
  await commentRef.update(patch);
}

// --- 댓글 삭제 핵심 로직 (Server Action) ---
export async function deleteCommentServerAction(postId: string, commentId: string) {
  const commentRef = db.collection('boards').doc(postId).collection('comments').doc(commentId);
  await commentRef.delete();
  // 게시물 댓글 수 감소
  const postRef = db.collection('boards').doc(postId);
  await postRef.update({
    commentsCount: FieldValue.increment(-1),
  });
}

// --- 댓글 '좋아요' 토글 핵심 로직 (Server Action) ---
export async function toggleBoardCommentLikeServerAction(postId: string, commentId: string, userId: string) {
  const commentRef = db.collection('boards').doc(postId).collection('comments').doc(commentId);
  const likeRef = commentRef.collection('likes').doc(userId);

  try {
    await db.runTransaction(async (transaction) => {
      const likeDoc = await transaction.get(likeRef);
      if (likeDoc.exists) { // Use .exists directly for admin SDK
        // 좋아요 취소
        transaction.delete(likeRef);
        transaction.update(commentRef, { likes: FieldValue.increment(-1) });
      } else {
        // 좋아요 추가
        transaction.set(likeRef, { createdAt: Timestamp.now() });
        transaction.update(commentRef, { likes: FieldValue.increment(1) });
      }
    });
  } catch (error) {
    console.error(`[toggleBoardCommentLikeServerAction] Error for comment ${commentId}:`, error);
    throw new Error("'좋아요' 처리에 실패했습니다.");
  }
}
