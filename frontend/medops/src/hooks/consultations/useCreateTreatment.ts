import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
import type { Treatment } from "../../types/consultation"; // 👈 asegúrate de tener este tipo

export interface CreateTreatmentInput {
  appointment: number;   // 👈 obligatorio
  diagnosis: number;     // 👈 obligatorio
  plan: string;          // 👈 obligatorio
  start_date?: string;   // 👈 opcional
  end_date?: string;     // 👈 opcional
}

export function useCreateTreatment() {
  const queryClient = useQueryClient();

  const mutation = useMutation<Treatment, Error, CreateTreatmentInput>({
    mutationFn: async (data) => {
      console.debug("Payload enviado a /api/treatments/:", data);
      return apiFetch<Treatment>("treatments/", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      // 🔹 refresca la consulta actual para que aparezca el nuevo tratamiento
      queryClient.invalidateQueries({ queryKey: ["consultation", "current"] });
    },
  });

  return {
    ...mutation,
    isPending: mutation.isPending,
  };
}
