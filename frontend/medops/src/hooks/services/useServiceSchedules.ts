// frontend/medops/src/hooks/services/useServiceSchedules.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/api/client';
import type { ServiceSchedule, ServiceScheduleInput } from '@/types/services';
export const useServiceSchedules = (serviceId: number) => {
  return useQuery<ServiceSchedule[]>({
    queryKey: ['serviceSchedules', serviceId],
    queryFn: async () => {
      const response = await apiFetch<ServiceSchedule[]>(
        `service-schedules/?service_id=${serviceId}`
      );
      return response;
    },
    enabled: !!serviceId,
  });
};
export const useCreateServiceSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation<ServiceSchedule, Error, ServiceScheduleInput>({
    mutationFn: async (data) => {
      return apiFetch<ServiceSchedule>('service-schedules/', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['serviceSchedules', variables.service] });
    },
  });
};
export const useDeleteServiceSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: async (id) => {
      await apiFetch<void>(`service-schedules/${id}/`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceSchedules'] });
    },
  });
};