import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
import type { MedicalReport } from "../../types/medicalReport";

export function useGenerateMedicalReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appointmentId: number): Promise<MedicalReport> => {
      return apiFetch<MedicalReport>(`consultations/${appointmentId}/generate-report/`, {
        method: "POST",
      });
    },
    onSuccess: (data) => {
      // 🔹 Invalida la cache de documentos del paciente
      if (data.patient) {
        queryClient.invalidateQueries({
          queryKey: ["documents", data.patient],
        });
      }
    },
  });
}
