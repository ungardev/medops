import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
import type { MedicalReport } from "../../types/medicalReport";

export function useGenerateMedicalReport() {
  return useMutation({
    mutationFn: async (appointmentId: number): Promise<MedicalReport> => {
      return apiFetch<MedicalReport>(`consultations/${appointmentId}/generate-report/`, {
        method: "POST",
      });
    },
  });
}
