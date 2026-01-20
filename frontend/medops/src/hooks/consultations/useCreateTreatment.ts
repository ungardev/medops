// src/hooks/consultations/useCreateTreatment.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
import type { Treatment, CreateTreatmentInput } from "../../types/consultation";
export function useCreateTreatment() {
  const queryClient = useQueryClient();
  const mutation = useMutation<Treatment, Error, CreateTreatmentInput>({
    mutationFn: async (data) => {
      const payload: CreateTreatmentInput = {
        title: data.title,  // ✅ AGREGADO: campo obligatorio faltante
        status: data.status ?? "active",
        treatment_type: data.treatment_type ?? "pharmacological",
        appointment: data.appointment,
        diagnosis: data.diagnosis,
        plan: data.plan,
        start_date: data.start_date,
        end_date: data.end_date,
        is_permanent: data.is_permanent,
        notes: data.notes,
      };
      console.debug("Payload enviado a POST /api/treatments/", payload);
      return apiFetch<Treatment>("treatments/", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointment", "current"] });
    },
  });
  return {
    ...mutation,
    isPending: mutation.isPending,
  };
}