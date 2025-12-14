// src/hooks/useWaitingRoomEntriesToday.ts
import { useQuery } from "@tanstack/react-query";
import type { WaitingRoomEntry } from "../../types/waitingRoom";
import { apiFetch } from "../../api/client";

// ✅ Fetch tipado con log de depuración
async function fetchEntriesToday(): Promise<WaitingRoomEntry[]> {
  const data = await apiFetch<WaitingRoomEntry[]>("waitingroom/today/entries/");
  console.log("🧪 fetchEntriesToday payload:", data);
  return data;
}

// ✅ Hook institucional SIN initialData ni placeholderData
//    Esto permite que isLoading sea TRUE al inicio y activa el overlay correctamente.
export function useWaitingRoomEntriesToday() {
  return useQuery<WaitingRoomEntry[], Error>({
    queryKey: ["waitingRoomEntriesToday"],
    queryFn: fetchEntriesToday,
    staleTime: 30_000,          // datos frescos por 30s
    refetchInterval: 5000,      // polling institucional cada 5s
    refetchOnMount: true,       // fuerza carga inicial real
    refetchOnWindowFocus: false // evita parpadeos al cambiar de pestaña
  });
}
