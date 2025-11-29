import { useQuery } from "@tanstack/react-query";
import { DashboardAPI } from "@/api/dashboard";
import { apiFetch } from "@/api/client"; // tu wrapper institucional sobre fetch
import type { DashboardSummary, EventLogEntry } from "@/types/dashboard";

export type DashboardParams = {
  start_date?: string;
  end_date?: string;
  range?: "day" | "week" | "month";
  currency?: "USD" | "VES";
};

// 🔹 Hook principal para el Dashboard
export function useDashboard(params?: DashboardParams) {
  return useQuery<DashboardSummary>({
    queryKey: [
      "dashboard-summary",
      params?.start_date ?? null,
      params?.end_date ?? null,
      params?.range ?? "month", // por defecto mes, para evitar confusión
      params?.currency ?? "USD",
    ],
    queryFn: () => DashboardAPI.summary(params),
    staleTime: 60_000, // cache de 1 minuto
  });
}

// 🔹 Hook específico para auditoría real
export function useAuditLogDirect(limit: number = 10) {
  return useQuery<EventLogEntry[]>({
    queryKey: ["audit-log-direct", limit],
    queryFn: async () => {
      return await apiFetch<EventLogEntry[]>(
        `audit/log/?limit=${limit}`,
        { method: "GET" }
      );
    },
    staleTime: 30_000, // cache corto para auditoría en vivo
  });
}
