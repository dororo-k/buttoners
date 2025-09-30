import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { Timestamp } from 'firebase/firestore';
import * as noticeRepo from '../services/noticeRepo';
import type { Notice } from '@/types/notice';

const NOTICE_QUERY_KEY = 'notices';

// 공지사항 목록을 조회하는 useQuery 훅
export function useNoticesQuery(options?: Partial<UseQueryOptions<Notice[], Error>>) {
  return useQuery<Notice[], Error>({
    queryKey: [NOTICE_QUERY_KEY],
    queryFn: noticeRepo.getNoticesOnce,
    staleTime: 5 * 60 * 1000, // 5분
    ...options,
  });
}

// 공지사항을 추가하는 useMutation 훅
export function useAddNoticeMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { title: string; body: string; authorName?: string }, { previousNotices: Notice[] | undefined }>({
    mutationFn: (newNotice) => noticeRepo.addNotice(newNotice),
    onMutate: async (newNotice) => {
      await queryClient.cancelQueries({ queryKey: [NOTICE_QUERY_KEY] });
      const previousNotices = queryClient.getQueryData<Notice[]>([NOTICE_QUERY_KEY]);
      queryClient.setQueryData<Notice[]>([NOTICE_QUERY_KEY], (old = []) => {
        const optimisticNotice: Notice = {
          ...newNotice,
          id: `temp-${Date.now()}`,
          no: (old[0]?.no ?? 0) + 1,
          pinned: false,
          viewCount: 0,
          createdAt: Timestamp.now().toDate().toISOString(), // Temporary, will be replaced by server
          updatedAt: Timestamp.now().toDate().toISOString(), // Temporary, will be replaced by server
        };
        return [optimisticNotice, ...old];
      });
      return { previousNotices };
    },
    onError: (err, newNotice, context) => {
      if (context?.previousNotices) {
        queryClient.setQueryData([NOTICE_QUERY_KEY], context.previousNotices);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notices'] });
    },
  });
}

// 공지사항을 삭제하는 useMutation 훅
export function useDeleteNoticeMutation() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string, { previousNotices: Notice[] | undefined }>({
    mutationFn: (id: string) => noticeRepo.deleteNotice(id),
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: [NOTICE_QUERY_KEY] });
      const previousNotices = queryClient.getQueryData<Notice[]>([NOTICE_QUERY_KEY]);
      queryClient.setQueryData<Notice[]>(
        [NOTICE_QUERY_KEY],
        (old = []) => old.filter((notice) => notice.id !== deletedId)
      );
      return { previousNotices };
    },
    onError: (err, newNotice, context) => {
      if (context?.previousNotices) {
        queryClient.setQueryData([NOTICE_QUERY_KEY], context.previousNotices);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notices'] });
    },
  });
}

// 공지사항 고정/해제 useMutation 훅
export const useTogglePinMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: string; pinned: boolean }, { previousNotices: Notice[] | undefined }>({
    mutationFn: ({ id, pinned }) => noticeRepo.togglePin(id, pinned),
    onMutate: async ({ id, pinned }) => {
      await queryClient.cancelQueries({ queryKey: [NOTICE_QUERY_KEY] });
      const previousNotices = queryClient.getQueryData<Notice[]>([NOTICE_QUERY_KEY]);
      queryClient.setQueryData<Notice[]>(
        [NOTICE_QUERY_KEY],
        (old = []) => old.map((notice) => (notice.id === id ? { ...notice, pinned } : notice))
      );
      return { previousNotices };
    },
    onError: (err, newNotice, context) => {
      if (context?.previousNotices) {
        queryClient.setQueryData([NOTICE_QUERY_KEY], context.previousNotices);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [NOTICE_QUERY_KEY] });
    },
  });
};

export const useUpdateNoticeMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<
    void,
    Error,
    { id: string; no: number; title: string; body: string; pinned: boolean },
    { previousNotices: Notice[] | undefined }
  >({
    mutationFn: async (noticeData) => {
      const { id, ...patch } = noticeData;
      await noticeRepo.updateNotice(id, patch);
    },
    onMutate: async (updatedNoticeData) => {
      await queryClient.cancelQueries({ queryKey: [NOTICE_QUERY_KEY] });
      const previousNotices = queryClient.getQueryData<Notice[]>([NOTICE_QUERY_KEY]);
      queryClient.setQueryData<Notice[]>(
        [NOTICE_QUERY_KEY],
        (old = []) =>
          old.map((notice) =>
            notice.id === updatedNoticeData.id
              ? { ...notice, ...updatedNoticeData, updatedAt: Timestamp.now().toDate().toISOString() }
              : notice
          )
      );
      return { previousNotices };
    },
    onError: (err, newNotice, context) => {
      if (context?.previousNotices) {
        queryClient.setQueryData([NOTICE_QUERY_KEY], context.previousNotices);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notices'] });
    },
  });
};
