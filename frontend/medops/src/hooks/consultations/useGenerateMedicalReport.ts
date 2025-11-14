import { useMutation, useQueryClient, UseMutationResult } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
import type { MedicalReport } from "../../types/medicalReport";

export function useGenerateMedicalReport(): UseMutationResult<MedicalReport, Error, number> {
  const queryClient = useQueryClient();

  return useMutation<MedicalReport, Error, number>({
    mutationFn: async (appointmentId: number): Promise<MedicalReport> => {
      return apiFetch<MedicalReport>(`consultations/${appointmentId}/generate-report/`, {
        method: "POST",
      });
    },
    onSuccess: (data) => {
      // 🔹 Invalidate patient documents cache
      if (data.patient) {
        queryClient.invalidateQueries({
          queryKey: ["documents", data.patient],
        });
      }
    },
  });
}
