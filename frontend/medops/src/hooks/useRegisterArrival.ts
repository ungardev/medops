// src/hooks/useRegisterArrival.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../api/client";

export function useRegisterArrival() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { patient_id: number; appointment_id?: number }) => {
      return apiFetch("waitingroom/register/", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      // 🔹 invalida también la query de la sala de espera
      queryClient.invalidateQueries({ queryKey: ["waitingRoomEntriesToday"] });
      queryClient.invalidateQueries({ queryKey: ["waitingroomGroupsToday"] });
    },
  });
}
