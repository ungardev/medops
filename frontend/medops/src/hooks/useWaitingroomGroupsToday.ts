// src/hooks/useWaitingroomGroupsToday.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/apiClient";
import type { WaitingroomGroup } from "../types/waitingRoom";

export function useWaitingroomGroupsToday() {
  return useQuery<WaitingroomGroup[], Error>({
    queryKey: ["waitingroomGroupsToday"],
    queryFn: async () => {
      const { data } = await api.get<WaitingroomGroup[]>("/waitingroom/groups-today/");
      return data;
    },
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}
