// src/hooks/waitingroom/useOperationalHub.ts
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/api/client';
interface OperationalHubData {
  live_queue: any[]; // Typar con WaitingRoomEntry si es posible
  pending_entries: any[]; // Typar con Appointment si es posible
  filters: {
    categories: { id: number; name: string }[];
    services: { id: number; name: string; category_id: number }[];
  };
}
export const useOperationalHub = (institutionId: number | null) => {
  return useQuery<OperationalHubData>({
    queryKey: ['operationalHub', institutionId],
    queryFn: async () => {
      if (!institutionId) {
        return { live_queue: [], pending_entries: [], filters: { categories: [], services: [] } };
      }
      // Ajustar la URL según tu configuración de API
      return apiFetch(`operational-hub/?institution_id=${institutionId}`);
    },
    staleTime: 10000, // 10 segundos
    enabled: !!institutionId,
  });
};