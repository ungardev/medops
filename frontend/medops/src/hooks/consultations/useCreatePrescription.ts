import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";

export interface CreatePrescriptionInput {
  appointment: number;   // 👈 añadido
  diagnosis: number;
  medication: string;
  dosage?: string;
  duration?: string;
}

export function useCreatePrescription() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: CreatePrescriptionInput) => {
      return apiFetch("prescriptions/", {
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
