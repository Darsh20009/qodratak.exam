
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface RealtimeUpdateOptions {
  enabled?: boolean;
  interval?: number;
}

export function useRealtimeUpdates(queryKey: string, options: RealtimeUpdateOptions = {}) {
  const queryClient = useQueryClient();
  const intervalRef = useRef<NodeJS.Timeout>();
  const { enabled = true, interval = 30000 } = options;

  const invalidateNow = () => {
    queryClient.invalidateQueries({ queryKey: [queryKey] });
  };

  useEffect(() => {
    if (!enabled) return;

    const startPolling = () => {
      intervalRef.current = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      }, interval);
    };

    startPolling();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [queryKey, enabled, interval, queryClient]);

  return { invalidateNow };
}

export function useFoldersRealtimeUpdates(userId: number) {
  const queryClient = useQueryClient();

  const updateFolders = () => {
    queryClient.invalidateQueries({ queryKey: [`/api/folders/user/${userId}`] });
  };

  useEffect(() => {
    // Listen for folder updates
    const handleFolderUpdate = () => {
      updateFolders();
    };

    window.addEventListener('folderUpdated', handleFolderUpdate);
    
    return () => {
      window.removeEventListener('folderUpdated', handleFolderUpdate);
    };
  }, [userId]);

  return { updateFolders };
}
