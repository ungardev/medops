// src/hooks/waitingroom/useStartConsultation.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
import { useDoctorConfig } from "@/hooks/settings/useDoctorConfig";
import type { Appointment } from "../../types/appointments";
export function useStartConsultation() {
  const queryClient = useQueryClient();
  const { data: doctor } = useDoctorConfig();
  
  return useMutation({
    mutationFn: async (entryId: number): Promise<Appointment> => {
      const doctorId = doctor?.id;
      
      return apiFetch<Appointment>(`waitingroom/${entryId}/start-consultation/`, {
        method: "POST",
        body: JSON.stringify({ doctor_id: doctorId }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waitingRoomEntriesToday"] });
      queryClient.invalidateQueries({ queryKey: ["appointment", "current"] });
    },
  });
}