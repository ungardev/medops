// src/hooks/useWaitingRoomEntriesToday.ts
import { useQuery } from "@tanstack/react-query";
import type { WaitingRoomEntry } from "../../types/waitingRoom";
import { apiFetch } from "../../api/client";

// 🔹 Fetch tipado y con log de depuración
async function fetchEntriesToday(): Promise<WaitingRoomEntry[]> {
  const data = await apiFetch<WaitingRoomEntry[]>("waitingroom/today/entries/");
  console.log("🧪 fetchEntriesToday payload:", data);
  return data;
}

// 🔹 Hook blindado con initialData y polling institucional
export function useWaitingRoomEntriesToday() {
  return useQuery<WaitingRoomEntry[], Error>({
    queryKey: ["waitingRoomEntriesToday"],
    queryFn: fetchEntriesToday,
    staleTime: 30_000,
    refetchInterval: 5000, // ⚔️ polling institucional cada 5s
    initialData: [],       // ⚔️ asegura que siempre sea un array tipado
  });
}
