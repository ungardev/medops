import { useQuery } from "@tanstack/react-query";
import type { WaitingRoomEntry } from "../types/waitingRoom";

async function fetchEntriesToday(): Promise<WaitingRoomEntry[]> {
  const token = localStorage.getItem("authToken");

  const res = await fetch("http://127.0.0.1/api/waitingroom/today/entries/", {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Token ${token}` } : {}),
    },
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
