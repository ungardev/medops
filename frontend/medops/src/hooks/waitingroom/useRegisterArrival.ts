// src/hooks/waitingroom/useRegisterArrival.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
import type { WaitingRoomEntry } from "../../types/waitingRoom";
export function useRegisterArrival() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      payload: { 
        patient_id: number; 
        appointment_id?: number;
        institution_id: number | null;
        service_id?: number | null; // NUEVO: Añadir service_id opcional
      }
    ): Promise<WaitingRoomEntry> => {
      return apiFetch<WaitingRoomEntry>("waitingroom/register/", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operationalHub"] });
    },
  });
}