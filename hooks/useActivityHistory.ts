import { useQuery } from '@tanstack/react-query';

interface Activity {
  id: string;
  activityType: 'COVER_LETTER' | 'LINKEDIN_MESSAGE' | 'EMAIL_MESSAGE';
  companyName: string;
  positionTitle?: string;
  recipient?: string;
  status?: string;
  llmModel?: string;
  isDeleted: boolean;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

interface ActivityHistoryResponse {
  activities: Activity[];
  pagination: Pagination;
}

interface UseActivityHistoryParams {
  page: number;
  limit?: number;
  search?: string;
  type?: string;
}

const fetchActivityHistory = async (params: UseActivityHistoryParams): Promise<ActivityHistoryResponse> => {
  const searchParams = new URLSearchParams({
    page: params.page.toString(),
    limit: (params.limit || 50).toString(),
  });

  if (params.search) searchParams.append('search', params.search);
  if (params.type) searchParams.append('type', params.type);

  const response = await fetch(`/api/activity-history?${searchParams}`);
  if (!response.ok) {
    throw new Error('Failed to load activity history');
  }
  return response.json();
};

export function useActivityHistory(params: UseActivityHistoryParams) {
  return useQuery<ActivityHistoryResponse>({
    queryKey: ['activity-history', params.page, params.search, params.type],
    queryFn: () => fetchActivityHistory(params),
    staleTime: 2 * 60 * 1000, // Fresh for 2 minutes
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    placeholderData: (previousData) => previousData, // Keep previous data while loading
  });
}
