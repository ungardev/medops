// src/hooks/operational/useOperationalHub.ts
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/api/client';
import { OperationalHubResponse, OperationalItem, OperationalStats } from '@/types/operational';
// Hook principal para Operational Hub
export const useOperationalHub = (institutionId: number | null, year?: number, month?: number) => {
  return useQuery({
    queryKey: ['operationalHub', institutionId, year, month],
    queryFn: async () => {
      if (!institutionId) {
        // Retornar estructura vacía válida si no hay institución
        return {
          timeline: [],
          live_queue: [],
          pending_entries: [],
          filters: { categories: [], services: [] },
          stats: {
            total_items: 0,
            appointments_count: 0,
            availability_count: 0,
            dates_with_activity: 0,
            avg_items_per_day: 0,
            period_days: 0
          },
          metadata: {
            year: year || new Date().getFullYear(),
            month: month || new Date().getMonth() + 1,
            start_date: '',
            end_date: '',
            total_days: 0
          }
        } as OperationalHubResponse;
      }
      
      // Construir URL con parámetros
      let url = `operational-hub/?institution_id=${institutionId}`;
      if (year) url += `&year=${year}`;
      if (month) url += `&month=${month}`;
      
      const response = await apiFetch<OperationalHubResponse>(url);
      return response;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos de stale time
    enabled: !!institutionId
  });
};
// Hook específico para items del calendario (timeline)
export const useCalendarTimeline = (institutionId: number | null, date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  
  return useOperationalHub(institutionId, year, month);
};
// Hook para items del día específico
export const useDayItems = (institutionId: number | null, date: Date) => {
  const { data: hubData } = useOperationalHub(institutionId, date.getFullYear(), date.getMonth() + 1);
  
  const dayItems = hubData?.timeline.filter(item => 
    item.date === date.toISOString().split('T')[0]
  ) || [];
  
  return { dayItems, isLoading: !hubData };
};