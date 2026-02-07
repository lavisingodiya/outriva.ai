import { useQuery, useQueryClient } from '@tanstack/react-query';

interface AnalyticsData {
  userGrowth: {
    total: number;
    last30Days: number;
    last7Days: number;
    today: number;
  };
  contentGeneration: {
    total: {
      coverLetters: number;
      linkedInMessages: number;
      emailMessages: number;
      all: number;
    };
    last30Days: {
      coverLetters: number;
      linkedInMessages: number;
      emailMessages: number;
      all: number;
    };
  };
  dailyStats: Array<{ date: string; count: number }>;
  userTypeDistribution: Array<{ userType: string; count: number }>;
  mostActiveUsers: Array<{
    id: string;
    email: string;
    userType: string;
    totalContent: number;
  }>;
  apiKeyAdoption: {
    openai: number;
    anthropic: number;
    gemini: number;
  };
  statusDistribution: {
    email: Array<{ status: string; count: number }>;
    linkedIn: Array<{ status: string; count: number }>;
  };
}

const fetchAdminAnalytics = async (): Promise<AnalyticsData> => {
  const response = await fetch('/api/admin/analytics');
  if (!response.ok) {
    throw new Error('Failed to load analytics');
  }
  return response.json();
};

export function useAdminAnalytics() {
  const queryClient = useQueryClient();

  const query = useQuery<AnalyticsData>({
    queryKey: ['admin-analytics'],
    queryFn: fetchAdminAnalytics,
    staleTime: 2 * 60 * 1000, // Fresh for 2 minutes
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  const invalidateAnalytics = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
  };

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    invalidateAnalytics,
  };
}
