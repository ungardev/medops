// src/hooks/consultations/useCreateTreatment.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
import type { Treatment, CreateTreatmentInput } from "../../types/consultation";
export function useCreateTreatment() {
  const queryClient = useQueryClient();
  
  const mutation = useMutation<Treatment, Error, CreateTreatmentInput>({
    mutationFn: async (data) => {
      const payload: CreateTreatmentInput = {
        title: data.title,
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
      
      console.debug("=== useCreateTreatment ===");
      console.debug("Payload enviado a POST /api/treatments/", JSON.stringify(payload, null, 2));
      
      const response = await apiFetch<Treatment>("treatments/", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      
      console.debug("Tratamiento creado exitosamente:", response);
      return response;
    },
    onSuccess: (data) => {
      console.debug("onSuccess: Invalidando cache de consulta actual...");
      queryClient.invalidateQueries({ queryKey: ["appointment", "current"] });
      console.debug("Cache invalidado. Nuevo treatment:", data);
    },
    onError: (error, data) => {
      console.error("=== ERROR en useCreateTreatment ===");
      console.error("Error:", error.message);
      console.error("Data que falló:", JSON.stringify(data, null, 2));
    },
  });
  
  return {
    ...mutation,
    isPending: mutation.isPending,
  };
}