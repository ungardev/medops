// src/hooks/consultations/useCreateDiagnosis.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
export interface CreateDiagnosisInput {
  appointment: number;
  icd_code: string;
  title: string;
  foundation_id?: string;
  description?: string;
}
export function useCreateDiagnosis() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (data: CreateDiagnosisInput) => {
      console.log("Payload diagnóstico:", data);
      return apiFetch("diagnoses/", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      // 🔧 FIX: Usar la key correcta ["appointment", "current"]
      queryClient.invalidateQueries({ queryKey: ["appointment", "current"] });
    },
  });
  return {
    ...mutation,
    isPending: mutation.isPending,
  };
}