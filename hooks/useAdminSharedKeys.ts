import { useQuery, useQueryClient } from '@tanstack/react-query';

interface SharedKey {
  id: string;
  provider: string;
  apiKeyMasked: string;
  models: string[];
  isActive: boolean;
  createdAt: string;
}

const fetchAdminSharedKeys = async (): Promise<SharedKey[]> => {
  const response = await fetch('/api/admin/shared-keys');
  if (!response.ok) {
    throw new Error('Failed to load shared keys');
  }
  const data = await response.json();
  return data.keys;
};

export function useAdminSharedKeys() {
  const queryClient = useQueryClient();

  const query = useQuery<SharedKey[]>({
    queryKey: ['admin-shared-keys'],
    queryFn: fetchAdminSharedKeys,
    staleTime: 2 * 60 * 1000, // Fresh for 2 minutes
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  const invalidateKeys = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-shared-keys'] });
  };

  return {
    keys: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    invalidateKeys,
  };
}
