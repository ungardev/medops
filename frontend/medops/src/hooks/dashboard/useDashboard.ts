import { useQuery } from "@tanstack/react-query";
import { DashboardAPI } from "@/api/dashboard";
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
      params?.range ?? "month",
      params?.currency ?? "USD",
    ],
    queryFn: () => DashboardAPI.summary(params),
    staleTime: 60_000, // 1 minuto de cache para evitar llamadas excesivas
  });
}

// 🔹 Hook específico para auditoría real (nuevo endpoint /api/audit/log/)
export function useAuditLogDirect(limit: number = 10) {
  return useQuery<EventLogEntry[]>({
    queryKey: ["audit-log-direct", limit],
    queryFn: async () => {
      const resp = await fetch(`/api/audit/log/?limit=${limit}`);
      if (!resp.ok) throw new Error("Error al cargar auditoría");
      return (await resp.json()) as EventLogEntry[];
    },
    staleTime: 30_000, // cache corto para auditoría en vivo
  });
}
