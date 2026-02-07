import { useQuery, useQueryClient } from '@tanstack/react-query';

interface UsageLimit {
  id: string;
  userType: 'FREE' | 'PLUS' | 'ADMIN';
  maxActivities: number;
  maxGenerations: number;
  maxFollowupGenerations: number;
  includeFollowups: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AdminSettings {
  limits: UsageLimit[];
  misuseMessage: string;
}

const fetchAdminSettings = async (): Promise<AdminSettings> => {
  const response = await fetch('/api/admin/settings');
  if (!response.ok) {
    throw new Error('Failed to load admin settings');
  }
  return response.json();
};

export function useAdminSettings() {
  const queryClient = useQueryClient();

  const query = useQuery<AdminSettings>({
    queryKey: ['admin-settings'],
    queryFn: fetchAdminSettings,
    staleTime: 2 * 60 * 1000, // Fresh for 2 minutes
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  const invalidateSettings = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
  };

  return {
    limits: query.data?.limits || [],
    misuseMessage: query.data?.misuseMessage || '',
    isLoading: query.isLoading,
    error: query.error,
    invalidateSettings,
  };
}
