// src/hooks/consultations/useCreatePrescription.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
import type { Prescription, CreatePrescriptionInput } from "../../types/consultation";

export function useCreatePrescription() {
  const queryClient = useQueryClient();

  const mutation = useMutation<Prescription, Error, CreatePrescriptionInput>({
    mutationFn: async (data) => {
      // 🔹 aplicamos defaults si no vienen del formulario
      const payload: CreatePrescriptionInput = {
        frequency: data.frequency ?? "once_daily",
        route: data.route ?? "oral",
        unit: data.unit ?? "mg",
        ...data,
      };

      console.debug("Payload enviado a POST /api/prescriptions/", payload);
      return apiFetch<Prescription>("prescriptions/", {
        method: "POST",
        body: JSON.stringify(payload),
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
