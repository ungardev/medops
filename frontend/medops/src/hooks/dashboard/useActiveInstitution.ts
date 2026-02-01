// src/hooks/dashboard/useActiveInstitution.ts
import { useQuery } from "@tanstack/react-query";
import { DashboardAPI } from "@/api/dashboard";
import type { InstitutionSettings } from "@/types/config";
export function useActiveInstitution() {
  return useQuery({
    queryKey: ["dashboard", "active-institution"],
    queryFn: DashboardAPI.activeInstitution,
    staleTime: 60_000, // cache de 1 minuto para métricas en tiempo real
    refetchInterval: 60_000, // refrescar cada minuto
    retry: 3,
  });
}
// Type helper para exportar si se necesita en otros componentes
export type ActiveInstitutionData = {
  institution: InstitutionSettings;
  metrics: {
    patients_today: number;
    appointments_today: number;
    payments_today: number;
    pending_payments: number;
  };
};