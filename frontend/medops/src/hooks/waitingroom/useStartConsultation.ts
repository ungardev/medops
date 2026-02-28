// src/hooks/waitingroom/useStartConsultation.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
import { useDoctorConfig } from "@/hooks/settings/useDoctorConfig";
import { useActiveInstitution } from "@/hooks/dashboard/useActiveInstitution";
import type { Appointment } from "../../types/appointments";
export function useStartConsultation() {
  const queryClient = useQueryClient();
  const { data: doctor } = useDoctorConfig();
  const { data: activeInstitution } = useActiveInstitution();
  
  return useMutation({
    mutationFn: async (entryId: number): Promise<Appointment> => {
      const doctorId = doctor?.id;
      const institutionId = activeInstitution?.institution?.id;
      
      return apiFetch<Appointment>(`waitingroom/${entryId}/start-consultation/`, {
        method: "POST",
        body: JSON.stringify({}),
        headers: {
          'X-Doctor-ID': String(doctorId),
          'X-Institution-ID': String(institutionId),
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waitingRoomEntriesToday"] });
      queryClient.invalidateQueries({ queryKey: ["appointment", "current"] });
    },
  });
}