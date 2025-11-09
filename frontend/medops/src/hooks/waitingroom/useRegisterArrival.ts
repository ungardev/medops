import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
import type { WaitingRoomEntry } from "../../types/waitingRoom";

export function useRegisterArrival() {
  return useMutation({
    // 🔹 Tipado estricto: devuelve el objeto completo
    mutationFn: async (
      payload: { patient_id: number; appointment_id?: number }
    ): Promise<WaitingRoomEntry> => {
      return apiFetch<WaitingRoomEntry>("waitingroom/register/", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
  });
}
