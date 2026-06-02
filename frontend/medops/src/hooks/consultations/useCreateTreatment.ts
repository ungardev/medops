// src/hooks/consultations/useCreateTreatment.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
import type { Treatment, CreateTreatmentInput } from "../../types/consultation";

interface MutationContext {
  previous: any;
}

export function useCreateTreatment() {
  const queryClient = useQueryClient();
  
  const mutation = useMutation<Treatment, Error, CreateTreatmentInput, MutationContext>({
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
    onMutate: async (newTreatment) => {
      await queryClient.cancelQueries({ queryKey: ["appointment", "current"] });
      const previous = queryClient.getQueryData(["appointment", "current"]);
      
      queryClient.setQueryData(["appointment", "current"], (old: any) => {
        if (!old) return old;
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const optimisticTreatment = {
          id: tempId,
          appointment: newTreatment.appointment,
          diagnosis: newTreatment.diagnosis,
          title: newTreatment.title || `Tratamiento`,
          plan: newTreatment.plan,
          status: newTreatment.status || "active",
          treatment_type: newTreatment.treatment_type || "pharmacological",
          start_date: newTreatment.start_date,
          end_date: newTreatment.end_date,
          is_permanent: newTreatment.is_permanent || false,
          isOptimistic: true,
          treatments: [],
          prescriptions: [],
        };
        return {
          ...old,
          treatments: [...(old.treatments || []), optimisticTreatment],
        };
      });
      
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["appointment", "current"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["appointment", "current"] });
    },
  });
  
  return {
    ...mutation,
    isPending: mutation.isPending,
  };
}