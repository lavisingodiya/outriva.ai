import { useQuery, useQueryClient } from '@tanstack/react-query';

interface UserProfile {
  id: string;
  email: string;
  userType: 'FREE' | 'PLUS' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
}

// Fetcher function
const fetchUserProfile = async (): Promise<UserProfile> => {
  const response = await fetch('/api/user/profile');
  if (!response.ok) {
    throw new Error('Failed to fetch user profile');
  }
  return response.json();
};

export function useUserProfile() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['user-profile'],
    queryFn: fetchUserProfile,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false,
  });

  const invalidateProfile = () => {
    queryClient.invalidateQueries({ queryKey: ['user-profile'] });
  };

  return {
    profile: query.data,
    isLoading: query.isLoading,
    error: query.error,
    invalidateProfile,
  };
}
