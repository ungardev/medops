import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";

export interface CreateDiagnosisInput {   // 👈 export aquí
  appointment: number;
  code: string;
  description?: string;
}

export function useCreateDiagnosis() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: CreateDiagnosisInput) => {
      return apiFetch("diagnoses/", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consultation", "current"] });
    },
  });

  return {
    ...mutation,
    isPending: mutation.isPending,
  };
}
