import { useQuery, useQueryClient } from '@tanstack/react-query';

export interface UserPreferences {
  defaultLlmModel?: string;
  defaultLength?: 'CONCISE' | 'MEDIUM' | 'LONG';
  defaultStatus?: 'DRAFT' | 'SENT' | 'DONE' | 'GHOST';
  resumeLink?: string;
}

interface PreferencesResponse {
  preferences: UserPreferences | null;
}

const fetchUserPreferences = async (): Promise<PreferencesResponse> => {
  const response = await fetch('/api/settings/preferences');
  if (!response.ok) {
    throw new Error('Failed to fetch user preferences');
  }
  return response.json();
};

export function useUserPreferences() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['user-preferences'],
    queryFn: fetchUserPreferences,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const invalidatePreferences = () => {
    queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
  };

  return {
    preferences: query.data?.preferences || null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    invalidatePreferences,
  };
}
