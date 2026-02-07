import { useQuery, useQueryClient } from '@tanstack/react-query';

export interface ModelOption {
  value: string;
  label: string;
  provider: string;
  isShared?: boolean;
}

interface AvailableModelsResponse {
  hasAnyKey: boolean;
  models: ModelOption[];
  modelsByProvider?: {
    openai: ModelOption[];
    anthropic: ModelOption[];
    gemini: ModelOption[];
  };
}

const fetchAvailableModels = async (): Promise<AvailableModelsResponse> => {
  const response = await fetch('/api/settings/available-models');
  if (!response.ok) {
    throw new Error('Failed to fetch available models');
  }
  return response.json();
};

export function useAvailableModels() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['available-models'],
    queryFn: fetchAvailableModels,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const invalidateModels = () => {
    queryClient.invalidateQueries({ queryKey: ['available-models'] });
  };

  return {
    models: query.data?.models || [],
    hasAnyKey: query.data?.hasAnyKey || false,
    modelsByProvider: query.data?.modelsByProvider,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    invalidateModels,
  };
}
