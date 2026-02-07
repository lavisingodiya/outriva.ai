import { useQuery } from '@tanstack/react-query';

interface Stats {
  users: {
    total: number;
    free: number;
    plus: number;
    admin: number;
  };
  content: {
    resumes: number;
    coverLetters: number;
    linkedInMessages: number;
    emailMessages: number;
    totalGenerated: number;
  };
  apiKeys: {
    openai: number;
    anthropic: number;
    gemini: number;
  };
}

interface RecentUser {
  id: string;
  email: string;
  userType: string;
  createdAt: string;
  updatedAt: string;
  hasOpenaiKey: boolean;
  hasAnthropicKey: boolean;
  hasGeminiKey: boolean;
  stats: {
    resumes: number;
    coverLetters: number;
    linkedinMessages: number;
    emailMessages: number;
    totalMessages: number;
  };
}

interface DashboardData {
  stats: Stats;
  recentUsers: RecentUser[];
}

export function useAdminDashboard() {
  return useQuery<DashboardData>({
    queryKey: ['admin', 'dashboard'],
    queryFn: async () => {
      const response = await fetch('/api/admin/dashboard');
      if (!response.ok) {
        throw new Error('Failed to fetch admin dashboard data');
      }
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
