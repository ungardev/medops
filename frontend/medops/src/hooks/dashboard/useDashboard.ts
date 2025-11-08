import { useQuery } from "@tanstack/react-query";
import { DashboardAPI } from "@/api/dashboard";
import type { DashboardSummary, EventLogEntry } from "@/types/dashboard"; // ✅

export type DashboardParams = {
  start_date?: string;
  end_date?: string;
  range?: "day" | "week" | "month";
  currency?: "USD" | "VES";
};

export function useDashboard(params?: DashboardParams) {
  return useQuery<DashboardSummary>({
    queryKey: ["dashboard-summary", params],
    queryFn: () => DashboardAPI.summary(params),
    staleTime: 60_000,
  });
}

// 🔹 Selector específico para auditoría
export function useAuditLog(params?: DashboardParams) {
  return useQuery<EventLogEntry[]>({
    queryKey: ["audit-log", params],
    queryFn: async () => {
      const summary = await DashboardAPI.summary(params);
      return summary.event_log ?? [];
    },
    staleTime: 60_000,
  });
}
