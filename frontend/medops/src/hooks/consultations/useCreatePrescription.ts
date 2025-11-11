import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
import type { Prescription } from "../../types/consultation"; // 👈 asegúrate de tener este tipo

export interface CreatePrescriptionInput {
  diagnosis: number;       // 👈 obligatorio
  medication: string;      // 👈 obligatorio
  dosage?: string;         // 👈 opcional
  duration?: string;       // 👈 opcional
}

export function useCreatePrescription() {
  const queryClient = useQueryClient();

  const mutation = useMutation<Prescription, Error, CreatePrescriptionInput>({
    mutationFn: async (data) => {
      console.debug("Payload enviado a /api/prescriptions/:", data);
      return apiFetch<Prescription>("prescriptions/", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      // 🔹 refresca la consulta actual para que aparezca la nueva prescripción
      queryClient.invalidateQueries({ queryKey: ["consultation", "current"] });
    },
  });

  return {
    ...mutation,
    isPending: mutation.isPending,
  };
}
