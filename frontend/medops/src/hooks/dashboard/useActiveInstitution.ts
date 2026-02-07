// src/hooks/dashboard/useActiveInstitution.ts
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";
import type { InstitutionSettings } from "@/types/config";
export type DashboardParams = {
  range?: "day" | "week" | "month";
  currency?: "USD" | "VES";
};
export type InstitutionMetrics = {
  scheduled_count: number;
  pending_count: number;
  waiting_count: number;
  in_consultation_count: number;
  completed_count: number;
  total_amount: number;
  payments_count: number;
  exempted_count: number;
};
export type ActiveInstitutionData = {
  institution: InstitutionSettings;
  metrics: InstitutionMetrics;
};
export function useActiveInstitution(params?: DashboardParams) {
  return useQuery<ActiveInstitutionData>({
    queryKey: [
      "dashboard",
      "active-institution-metrics",
      params?.range ?? "day",
      params?.currency ?? "USD"
    ],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.range) searchParams.append('range', params.range);
      if (params?.currency) searchParams.append('currency', params.currency);
      
      return await apiFetch<ActiveInstitutionData>(
        `dashboard/active-institution-metrics/?${searchParams.toString()}`,
        { method: "GET" }
      );
    },
    staleTime: 60_000, // cache de 1 minuto
    refetchInterval: 60_000, // refrescar cada minuto
    retry: 3,
  });
}
// Función auxiliar para refrescar manualmente
export function useRefreshActiveInstitution() {
  return useQuery({
    queryKey: ["dashboard", "active-institution-metrics"],
    queryFn: () => apiFetch<ActiveInstitutionData>(
      "dashboard/active-institution-metrics/",
      { method: "GET" }
    ),
    enabled: false, // Solo para refrescar manualmente
  });
}