// src/features/board/hooks/useBoardQueries.ts

import { useMutation, useQueryClient, useInfiniteQuery, type UseInfiniteQueryOptions, type InfiniteData } from '@tanstack/react-query';

import { getBoardPostsOnceAction, addBoardPostServerAction, updateBoardPostServerAction, deleteBoardPostServerAction } from '../actions';
import type { BoardPost } from '../types';
import { Timestamp } from 'firebase/firestore';

const POSTS_QUERY_KEY = ['board', 'posts'];

// --- Queries ---

// 쿼리 함수가 반환하는 단일 페이지의 데이터 타입
type PageData = {
  posts: BoardPost[];
  nextCursor: number | null;
};

// useInfiniteQuery 훅의 전체 데이터 구조 타입
type InfinitePostsData = InfiniteData<PageData>;

// 훅에 전달할 옵션 타입 정의
type InfinitePostsQueryOptions = {
  query?: string;
} & Partial<UseInfiniteQueryOptions<PageData, Error, InfinitePostsData>>;

/**
 * 게시물 목록을 무한 스크롤로 조회하는 useInfiniteQuery 훅
 */
export function useInfinitePostsQuery(options: InfinitePostsQueryOptions) {
  const { query, ...restOptions } = options;
  return useInfiniteQuery<PageData, Error, InfinitePostsData, readonly unknown[]>({
    queryKey: [...POSTS_QUERY_KEY, { query }],
    queryFn: ({ pageParam }) => 
      getBoardPostsOnceAction({ pageParam: pageParam as number | undefined, query }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 0, // Force re-fetch on invalidation
    ...restOptions, // initialData 등 나머지 옵션들을 여기에 전달
  });
}

// --- Mutations ---

type NewPostInput = Omit<BoardPost, 'id' | 'no' | 'commentsCount' | 'views' | 'likes' | 'createdAt' | 'updatedAt'>;

/**
 * 게시물을 추가하는 useMutation 훅 (낙관적 업데이트 적용)
 */
export function useAddPostMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, NewPostInput, { previousPosts: BoardPost[] | undefined }>({
    mutationFn: addBoardPostServerAction,
    // onMutate: 뮤테이션이 시작되기 전에 실행되며, UI를 미리 업데이트합니다.
    onMutate: async (newPost) => {
      // 진행 중인 refetch가 있다면 취소하여 낙관적 업데이트를 덮어쓰지 않도록 합니다.
      await queryClient.cancelQueries({ queryKey: POSTS_QUERY_KEY });

      // 롤백을 위해 이전 데이터를 저장해둡니다.
      const previousPosts = queryClient.getQueryData<BoardPost[]>(POSTS_QUERY_KEY);

      // UI를 즉시 업데이트합니다.
      queryClient.setQueryData<BoardPost[]>(POSTS_QUERY_KEY, (old) => {
        // 실제 데이터가 아니므로 임시 ID와 현재 시간을 사용합니다.
        const optimisticPost: BoardPost = {
          ...newPost,
          id: `temp-${Date.now()}`,
          no: (old?.[0]?.no ?? 0) + 1,
          createdAt: Timestamp.fromDate(new Date()).toDate().toISOString(),
          updatedAt: Timestamp.fromDate(new Date()).toDate().toISOString(),
          likes: 0,
          views: 0,
          commentsCount: 0,
        };
        return old ? [optimisticPost, ...old] : [optimisticPost];
      });

      // 에러 발생 시 롤백에 사용할 데이터를 context로 반환합니다.
      return { previousPosts };
    },
    // onError: 뮤테이션 실패 시 실행됩니다.
    onError: (err, newPost, context: { previousPosts: BoardPost[] | undefined } | undefined) => {
      // onMutate에서 저장해둔 이전 데이터로 UI를 되돌립니다.
      if (context?.previousPosts) {
        queryClient.setQueryData(POSTS_QUERY_KEY, context.previousPosts);
      }
    },
    // onSettled: 성공/실패 여부와 관계없이 뮤테이션이 끝나면 항상 실행됩니다.
    onSettled: () => {
      // 서버의 최신 데이터와 동기화하기 위해 쿼리를 무효화합니다.
      queryClient.invalidateQueries({ queryKey: POSTS_QUERY_KEY });
    },
  });
}

/**
 * 게시물을 수정하는 useMutation 훅 (setQueryData로 즉시 업데이트)
 */
export function useUpdatePostMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { id: string; patch: Partial<BoardPost> }>({
    mutationFn: (variables) => updateBoardPostServerAction(variables.id, variables.patch),
    onSuccess: (data, variables) => {
      // 목록 쿼리의 캐시를 직접 업데이트하여 refetch를 줄입니다.
      queryClient.setQueryData<BoardPost[]>(POSTS_QUERY_KEY, (old) =>
        old ? old.map((post) => (post.id === variables.id ? { ...post, ...variables.patch } : post)) : [],
      );

      // 상세 페이지 쿼리가 있다면 함께 업데이트해줍니다.
      const detailQueryKey = ['board', 'post', variables.id];
      queryClient.setQueryData(detailQueryKey, (oldData: any) =>
        oldData ? { ...oldData, ...variables.patch } : undefined,
      );
    },
  });
}

/**
 * 게시물을 삭제하는 useMutation 훅 (낙관적 업데이트 적용)
 */
export function useDeletePostMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string, { previousPosts: BoardPost[] | undefined }>({ // Added TContext
    mutationFn: deleteBoardPostServerAction,
    onMutate: async (postIdToDelete) => {
      await queryClient.cancelQueries({ queryKey: POSTS_QUERY_KEY });
      const previousPosts = queryClient.getQueryData<BoardPost[]>(POSTS_QUERY_KEY);

      // UI에서 해당 포스트를 즉시 제거합니다.
      queryClient.setQueryData<BoardPost[]>(POSTS_QUERY_KEY, (old) =>
        old ? old.filter((post) => post.id !== postIdToDelete) : [],
      );

      return { previousPosts };
    },
    onError: (err, postId, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(POSTS_QUERY_KEY, context.previousPosts);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: POSTS_QUERY_KEY });
    },
  });
}
