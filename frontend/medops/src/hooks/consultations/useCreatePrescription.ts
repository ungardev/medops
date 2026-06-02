// src/hooks/consultations/useCreatePrescription.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
import type { Prescription, CreatePrescriptionInput } from "../../types/consultation";

interface MutationContext {
  previous: any;
}

export function useCreatePrescription() {
  const queryClient = useQueryClient();
  
  const mutation = useMutation<Prescription, Error, CreatePrescriptionInput, MutationContext>({
    mutationFn: async (data) => {
      const payload: CreatePrescriptionInput = {
        frequency: data.frequency ?? "once_daily",
        route: data.route ?? "oral",
        ...data,
      };
      
      console.debug("=== useCreatePrescription ===");
      console.debug("Payload enviado a POST /api/prescriptions/", JSON.stringify(payload, null, 2));
      
      const response = await apiFetch<Prescription>("prescriptions/", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      
      console.debug("Prescripción creada exitosamente:", response);
      return response;
    },
    onMutate: async (newPrescription) => {
      await queryClient.cancelQueries({ queryKey: ["appointment", "current"] });
      const previous = queryClient.getQueryData(["appointment", "current"]);
      
      queryClient.setQueryData(["appointment", "current"], (old: any) => {
        if (!old) return old;
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const optimisticPrescription = {
          id: tempId,
          diagnosis: newPrescription.diagnosis,
          medication_catalog: null,
          medication_text: newPrescription.medication_text || "—",
          medication_name: newPrescription.medication_text || "—",
          dosage_form: newPrescription.dosage_form,
          route: newPrescription.route || "oral",
          frequency: newPrescription.frequency || "once_daily",
          duration: newPrescription.duration,
          indications: newPrescription.indications,
          components: newPrescription.components || [],
          isOptimistic: true,
        };
        return {
          ...old,
          prescriptions: [...(old.prescriptions || []), optimisticPrescription],
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