import { useQuery } from '@tanstack/react-query';
import { DashboardAPI } from '@/api/dashboard';

export function useWaitingRoomToday() {
  return useQuery({
    queryKey: ['waitingroom-today'],
    queryFn: DashboardAPI.waitingRoomToday,
    refetchInterval: 20_000,
  });
}

export function useAppointmentsToday() {
  return useQuery({
    queryKey: ['appointments-today'],
    queryFn: DashboardAPI.appointmentsToday,
    refetchInterval: 20_000,
  });
}
