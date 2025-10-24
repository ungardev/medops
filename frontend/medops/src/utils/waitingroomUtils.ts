// src/utils/waitingroomUtils.ts
import { WaitingRoomEntry } from "../types/waitingRoom";

export function groupEntries(entries: WaitingRoomEntry[]) {
  const grouped: Record<string, WaitingRoomEntry[]> = {
    "Grupo A": [],
    "Grupo B": [],
  };

  entries.forEach((entry) => {
    if (entry.priority === "scheduled" || entry.priority === "emergency") {
      grouped["Grupo A"].push(entry);
    } else if (entry.priority === "walkin") {
      grouped["Grupo B"].push(entry);
    }
  });

  return grouped;
}
