import { useQuery, useQueryClient } from '@tanstack/react-query';

// Check admin status by calling admin-only endpoint
const checkAdminStatus = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/admin/stats');
    return response.ok; // 200 = admin, 403 = not admin
  } catch {
    return false;
  }
};

export function useAdminAuth() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['admin-auth'],
    queryFn: checkAdminStatus,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false,
    retry: 1, // Only retry once on failure
  });

  const invalidateAuth = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-auth'] });
  };

  return {
    isAdmin: query.data ?? false,
    isLoading: query.isLoading,
    invalidateAuth,
  };
}
