// src/hooks/appointments/useScheduledItems.ts
import { useQuery } from '@tanstack/react-query';
import { keepPreviousData } from '@tanstack/react-query';
import { Appointment } from '@/types/appointments';
import { getAppointments } from '@/api/appointments';

export const useScheduledItems = () => {
  return useQuery({
    queryKey: ['scheduledItems'],
    queryFn: getAppointments,
    staleTime: 1000 * 60 * 5,
    gcTime: Infinity,
    placeholderData: keepPreviousData,
  });
};
