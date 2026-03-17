import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/api/client';
import type { ServiceSchedule } from '@/types/services';
export const useAllServiceSchedules = (institutionId: number) => {
  return useQuery<ServiceSchedule[]>({
    queryKey: ['allServiceSchedules', institutionId],
    queryFn: async () => {
      const response = await apiFetch<{ results: ServiceSchedule[] }>(
        `service-schedules/?institution_id=${institutionId}`
      );
      return response.results;
    },
    enabled: !!institutionId,
  });
};