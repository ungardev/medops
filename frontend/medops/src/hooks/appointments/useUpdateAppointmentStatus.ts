// src/hooks/appointments/useUpdateAppointmentStatus.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
import type { AppointmentStatus } from "../../types/appointments";
interface UpdateStatusInput {
  id: number;
  status: AppointmentStatus;
}
export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: UpdateStatusInput) => {
      return apiFetch(`appointments/${id}/status/`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["waitingRoomEntriesToday"] }); // ✅ NUEVO
    },
  });
}