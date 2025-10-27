import { useQuery } from "@tanstack/react-query";
import type { WaitingRoomEntry } from "../types/waitingRoom";

async function fetchEntriesToday(): Promise<WaitingRoomEntry[]> {
  const res = await fetch("/api/waitingroom/today/entries", {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  if (!res.ok) throw new Error("Error fetching waiting room entries");
  return res.json();
}

export function useWaitingRoomEntriesToday() {
  return useQuery<WaitingRoomEntry[]>({
    queryKey: ["waitingroom-entries-today"],
    queryFn: fetchEntriesToday,
    staleTime: 30_000,
  });
}
