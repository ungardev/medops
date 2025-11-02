import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";

export interface CreateTreatmentInput {   // 👈 export aquí
  diagnosis: number;
  plan: string;
  start_date?: string;
  end_date?: string;
}

export function useCreateTreatment() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: CreateTreatmentInput) => {
      return apiFetch("treatments/", {
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
