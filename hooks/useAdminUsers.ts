import { useQuery, useQueryClient } from '@tanstack/react-query';

interface User {
  id: string;
  email: string;
  userType: 'FREE' | 'PLUS' | 'ADMIN';
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

interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalCount: number;
  };
}

const fetchAdminUsers = async (
  page: number,
  userTypeFilter: string,
  search: string
): Promise<UsersResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: '20',
    ...(userTypeFilter !== 'ALL' && { userType: userTypeFilter }),
    ...(search && { search }),
  });

  const response = await fetch(`/api/admin/users?${params}`);
  if (!response.ok) {
    throw new Error('Failed to load users');
  }
  return response.json();
};

export function useAdminUsers(page: number, userTypeFilter: string, search: string) {
  const queryClient = useQueryClient();

  const query = useQuery<UsersResponse>({
    queryKey: ['admin-users', page, userTypeFilter, search],
    queryFn: () => fetchAdminUsers(page, userTypeFilter, search),
    staleTime: 2 * 60 * 1000, // Fresh for 2 minutes
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    placeholderData: (previousData) => previousData, // Keep old data while loading new page for smooth pagination
  });

  const invalidateUsers = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
  };

  return {
    users: query.data?.users || [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    error: query.error,
    invalidateUsers,
  };
}
