import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
import type { Appointment } from "../../types/appointments";
export function useStartConsultation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (entryId: number): Promise<Appointment> => {
      return apiFetch<Appointment>(`waitingroom/${entryId}/start-consultation/`, {
        method: "POST",
        body: JSON.stringify({}),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waitingRoomEntriesToday"] });
      queryClient.invalidateQueries({ queryKey: ["appointment", "current"] });
    },
  });
}