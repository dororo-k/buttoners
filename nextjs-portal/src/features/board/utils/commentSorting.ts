import type { Comment } from '@/features/board/types';

export const sortComments = (
  comments: Comment[],
  sortBy: 'latest' | 'oldest' | 'likes' = 'latest'
): Comment[] => {
  const sorted = [...comments];

  switch (sortBy) {
    case 'latest':
      sorted.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
      break;
    case 'oldest':
      sorted.sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis());
      break;
    case 'likes':
      sorted.sort((a, b) => b.likes - a.likes);
      break;
    default:
      // Default to latest if an unknown sortBy is provided
      sorted.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
      break;
  }

  return sorted;
};

