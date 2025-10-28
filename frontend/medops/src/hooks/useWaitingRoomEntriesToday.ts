// src/hooks/useWaitingRoomEntriesToday.ts
import { useQuery } from "@tanstack/react-query";
import type { WaitingRoomEntry } from "../types/waitingRoom";
import { apiFetch } from "../api/client";

async function fetchEntriesToday(): Promise<WaitingRoomEntry[]> {
  return apiFetch("waitingroom/today/entries/");
}

export function useWaitingRoomEntriesToday() {
  return useQuery<WaitingRoomEntry[]>({
    queryKey: ["waitingRoomEntriesToday"], // 🔹 clave consistente con invalidateQueries
    queryFn: fetchEntriesToday,
    staleTime: 30_000, // 30s de cache
  });
}
