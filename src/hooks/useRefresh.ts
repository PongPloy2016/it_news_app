import { useCallback, useState } from 'react';
import { useNews } from '../store/NewsContext';

export function useRefresh() {
  const { refresh, isRefreshing, lastUpdated } = useNews();
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshError(null);
      await refresh();
    } catch (err) {
      setRefreshError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการรีเฟรช');
    }
  }, [refresh]);

  return {
    isRefreshing,
    lastUpdated,
    refreshError,
    refresh: handleRefresh,
  };
}

export default useRefresh;
