import { useQuery } from '@tanstack/react-query';
import { DashboardAPI } from '@/api/dashboard';
import type { DashboardSummary } from '@/types/dashboard';

export function useDashboardSummary(params?: { start_date?: string; end_date?: string }) {
  return useQuery<DashboardSummary>({
    queryKey: ['dashboard-summary', params],
    queryFn: () => DashboardAPI.summary(params),
    staleTime: 60_000,
  });
}
