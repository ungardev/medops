// src/hooks/waitingroom/useOperationalHub.ts
import { useQuery } from '@tanstack/react-query';
import { keepPreviousData } from '@tanstack/react-query';
import { apiFetch } from '@/api/client';

interface OperationalHubData {
  live_queue: any[];
  pending_entries: any[];
  filters: {
    categories: { id: number; name: string }[];
    services: { id: number; name: string; category_id: number }[];
  };
}

export const useOperationalHub = (institutionId: number | null) => {
  return useQuery<OperationalHubData>({
    queryKey: ['operationalHub', institutionId],
    queryFn: async () => {
      if (!institutionId) {
        return { live_queue: [], pending_entries: [], filters: { categories: [], services: [] } };
      }
      return apiFetch(`operational-hub/?institution_id=${institutionId}`);
    },
    staleTime: 60_000,
    gcTime: Infinity,
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
    enabled: !!institutionId,
  });
};