// src/utils/waitingroomUtils.ts
import { WaitingRoomEntry } from "../types/waitingRoom";

export function groupEntries(entries: WaitingRoomEntry[]) {
  const grouped: Record<string, WaitingRoomEntry[]> = {
    "Grupo A": [], // Emergencias
    "Grupo B": [], // Normales
  };

  entries.forEach((entry) => {
    if (entry.priority === "emergency") {
      grouped["Grupo A"].push(entry);
    } else if (entry.priority === "normal") {
      grouped["Grupo B"].push(entry);
    }
  });

  return grouped;
}
