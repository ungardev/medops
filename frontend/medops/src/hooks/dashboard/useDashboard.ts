// src/hooks/dashboard/useDashboard.ts
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
  const query = useQuery<DashboardSummary>({
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

  // 🔹 Derivar alias compactos para MetricsRow.tsx
  const metrics = query.data
    ? {
        scheduled_count: query.data.total_appointments,
        pending_count: query.data.pending_appointments,
        waiting_count: query.data.waiting_room_count,
        in_consultation_count: query.data.active_consultations,
        completed_count: query.data.completed_appointments,
        total_amount: query.data.total_payments_amount,
        payments_count: query.data.total_payments,
        exempted_count: query.data.total_waived,
      }
    : null;

  return { ...query, metrics };
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
