// src/hooks/useWaitingroomGroupsToday.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/apiClient";
import type { WaitingroomGroupsTodayResponse } from "../../types/waitingRoom";

export function useWaitingroomGroupsToday() {
  return useQuery<WaitingroomGroupsTodayResponse>({
    queryKey: ["waitingroomGroupsToday"],
    queryFn: async () => {
      const { data } = await api.get<WaitingroomGroupsTodayResponse>(
        "/waitingroom/groups-today/"
      );
      return data;
    },
    // 👇 Esto asegura que groups siempre tenga arrays vacíos en el primer render
    initialData: { by_status: [], by_priority: [] },
    refetchInterval: 5000, // refresco automático cada 5s
  });
}
