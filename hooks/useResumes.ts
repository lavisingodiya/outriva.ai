import { useQuery, useQueryClient } from '@tanstack/react-query';

export interface Resume {
  id: string;
  title: string;
  content: string;
  isDefault: boolean;
  createdAt: string;
}

interface ResumesResponse {
  resumes: Resume[];
}

const fetchResumes = async (): Promise<ResumesResponse> => {
  const response = await fetch('/api/settings/resumes');
  if (!response.ok) {
    throw new Error('Failed to fetch resumes');
  }
  return response.json();
};

export function useResumes() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['resumes'],
    queryFn: fetchResumes,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const invalidateResumes = () => {
    queryClient.invalidateQueries({ queryKey: ['resumes'] });
  };

  const getDefaultResume = () => {
    return query.data?.resumes.find(r => r.isDefault);
  };

  return {
    resumes: query.data?.resumes || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    invalidateResumes,
    getDefaultResume,
  };
}
