// src/hooks/operational/useOperationalHub.ts
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/api/client';
import { Appointment } from '@/types/appointments';
// Interfaz unificada para items operativos
export interface OperationalItem {
  id: number;
  type: 'appointment' | 'service' | 'block';
  date: string;
  time?: string;
  title: string;
  status: string;
  patientName?: string;
  doctorName?: string;
  serviceName?: string;
  color?: string;
  metadata: Record<string, any>;
}
// Interfaz para la respuesta del endpoint unificado
export interface OperationalHubResponse {
  live_queue: OperationalItem[];
  pending_entries: OperationalItem[];
  filters: {
    categories: { id: number; name: string }[];
    services: { id: number; name: string; category_id: number }[];
  };
  timeline: OperationalItem[]; // Items unificados para el calendario
}
export const useOperationalHub = (institutionId: number | null) => {
  return useQuery({
    queryKey: ['operationalHub', institutionId],
    queryFn: async () => {
      if (!institutionId) {
        return {
          live_queue: [],
          pending_entries: [],
          filters: { categories: [], services: [] },
          timeline: []
        } as OperationalHubResponse;
      }
      
      const response = await apiFetch<OperationalHubResponse>(
        `operational-hub/?institution_id=${institutionId}`
      );
      
      // Si el backend no devuelve timeline, generar uno combinado
      if (!response.timeline) {
        response.timeline = [
          ...response.live_queue.map(item => ({ ...item, type: 'appointment' as const })),
          ...response.pending_entries.map(item => ({ ...item, type: 'appointment' as const }))
        ];
      }
      
      return response;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos de stale time
    enabled: !!institutionId
  });
};
// Hook específico para items del calendario
export const useCalendarItems = (institutionId: number | null, month: Date) => {
  return useQuery({
    queryKey: ['calendarItems', institutionId, month.toISOString()],
    queryFn: async () => {
      if (!institutionId) return [] as OperationalItem[];
      
      const year = month.getFullYear();
      const monthNum = month.getMonth() + 1;
      
      const response = await apiFetch<{ results: any[] }>(
        `operational-hub/?institution_id=${institutionId}&year=${year}&month=${monthNum}`
      );
      
      // Mapear a OperationalItem si es necesario
      return response.results.map((item: any) => ({
        id: item.id,
        type: item.type || 'appointment',
        date: item.date || item.appointment_date,
        time: item.time || item.tentative_time,
        title: item.title || item.patient_name || 'Servicio',
        status: item.status,
        patientName: item.patient_name,
        doctorName: item.doctor_name,
        serviceName: item.service_name,
        metadata: item
      })) as OperationalItem[];
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!institutionId
  });
};