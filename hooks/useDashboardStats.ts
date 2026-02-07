import { useQuery, useQueryClient } from '@tanstack/react-query';

export interface DashboardStats {
  totalCoverLetters: number;
  totalLinkedInMessages: number;
  totalEmails: number;
  totalGenerated: number;
  monthlyCount: number;
  monthlyLimit: number;
  daysUntilReset: number;
  hoursSaved: number;
  usagePercentage: number;
  maxActivities: number;
  userType: 'FREE' | 'PLUS' | 'ADMIN';
  generationCount: number;
  followupGenerationCount: number;
  activityCount: number;
  recentActivity: Array<{
    id: string;
    type: 'Cover Letter' | 'LinkedIn' | 'Email';
    company: string;
    position: string;
    createdAt: string;
    wordCount: number;
    status: string | null;
    messageType: string | null;
    hasFollowUp: boolean;
    data: any | null;
  }>;
}

// Fetcher function
const fetchDashboardStats = async (): Promise<DashboardStats> => {
  const response = await fetch('/api/dashboard/stats');
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard stats');
  }
  return response.json();
};

export function useDashboardStats() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: fetchDashboardStats,
    staleTime: 60 * 1000, // Consider data fresh for 60 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  // Function to manually refresh dashboard stats
  const refreshStats = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
  };

  return {
    ...query,
    refreshStats,
  };
}
