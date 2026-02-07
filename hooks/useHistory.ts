import { useQuery, useQueryClient } from '@tanstack/react-query';

interface HistoryItem {
  id: string;
  type: 'Cover Letter' | 'LinkedIn' | 'Email';
  company: string;
  position: string;
  status?: string;
  createdAt: string;
  content?: string;
  subject?: string;
  body?: string;
  messageType?: string;
  hasFollowUp?: boolean;
}

const fetchHistory = async (): Promise<HistoryItem[]> => {
  const response = await fetch('/api/history');
  if (!response.ok) {
    throw new Error('Failed to load history');
  }
  const data = await response.json();
  return data.history || [];
};

export function useHistory() {
  const queryClient = useQueryClient();

  const query = useQuery<HistoryItem[]>({
    queryKey: ['history'],
    queryFn: fetchHistory,
    staleTime: 2 * 60 * 1000, // Fresh for 2 minutes
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  const invalidateHistory = () => {
    queryClient.invalidateQueries({ queryKey: ['history'] });
  };

  return {
    history: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    invalidateHistory,
  };
}
