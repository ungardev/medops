// src/hooks/consultations/useCreatePrescription.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
import type { Prescription } from "../../types/consultation";

export interface CreatePrescriptionInput {
  diagnosis: number;       // 👈 obligatorio
  medication: string;      // 👈 obligatorio
  dosage?: string;         // 👈 opcional
  duration?: string;       // 👈 opcional
  frequency?: "daily" | "bid" | "tid" | "qid"; // 👈 añadido
  route?: "oral" | "iv" | "im" | "sc";         // 👈 añadido
  unit?: "mg" | "ml" | "g" | "tablet";         // 👈 añadido
}

export function useCreatePrescription() {
  const queryClient = useQueryClient();

  const mutation = useMutation<Prescription, Error, CreatePrescriptionInput>({
    mutationFn: async (data) => {
      // 🔹 aplicamos defaults si no vienen del formulario
      const payload = {
        frequency: data.frequency ?? "daily",
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
