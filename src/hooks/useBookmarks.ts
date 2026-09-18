import { useCallback, useMemo } from 'react';
import { useNews } from '../store/NewsContext';
import { NewsArticle } from '../types';

export function useBookmarks() {
  const { bookmarks, toggleBookmark, clearBookmarks } = useNews();

  const bookmarkList = useMemo(() => Object.values(bookmarks), [bookmarks]);
  const bookmarkCount = useMemo(() => Object.keys(bookmarks).length, [bookmarks]);

  const isBookmarked = useCallback(
    (articleId: string) => Boolean(bookmarks[articleId]),
    [bookmarks],
  );

  return {
    bookmarks,
    bookmarkList,
    bookmarkCount,
    isBookmarked,
    toggleBookmark,
    clearBookmarks,
  };
}

export default useBookmarks;
