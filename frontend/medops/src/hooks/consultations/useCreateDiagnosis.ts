// src/hooks/consultations/useCreateDiagnosis.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
import type { Diagnosis } from "../../types/consultation";

export interface CreateDiagnosisInput {
  appointment: number;
  icd_code: string;
  title: string;
  foundation_id?: string;
  description?: string;
  type?: string;
  status?: string;
  catalog?: string;
}

interface MutationContext {
  previous: any;
}

export function useCreateDiagnosis() {
  const queryClient = useQueryClient();
  
  const mutation = useMutation<any, Error, CreateDiagnosisInput, MutationContext>({
    mutationFn: async (data: CreateDiagnosisInput) => {
      console.log("Payload diagnóstico:", data);
      return apiFetch("diagnoses/", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onMutate: async (newDiagnosis) => {
      await queryClient.cancelQueries({ queryKey: ["appointment", "current"] });
      const previous = queryClient.getQueryData(["appointment", "current"]);
      
      queryClient.setQueryData(["appointment", "current"], (old: any) => {
        if (!old) return old;
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const optimisticDiagnosis = {
          id: tempId,
          appointment: newDiagnosis.appointment,
          icd_code: newDiagnosis.icd_code,
          title: newDiagnosis.title,
          description: newDiagnosis.description || "",
          type: newDiagnosis.type || "presumptive",
          status: newDiagnosis.status || "under_investigation",
          catalog: newDiagnosis.catalog || "icd11",
          created_by: { full_name: "Doctor" },
          isOptimistic: true,
          treatments: [],
          prescriptions: [],
        };
        return {
          ...old,
          diagnoses: [...(old.diagnoses || []), optimisticDiagnosis],
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