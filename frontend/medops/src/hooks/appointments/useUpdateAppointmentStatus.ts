// src/hooks/appointments/useUpdateAppointmentStatus.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateAppointmentStatus } from "../../api/consultation";

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { id: number; status: string }) =>
      updateAppointmentStatus(data.id, data.status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waitingRoomEntriesToday"] });
      queryClient.invalidateQueries({ queryKey: ["consultation", "current"] });
    },
  });
}
