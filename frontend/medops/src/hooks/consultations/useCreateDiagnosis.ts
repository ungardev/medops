// src/hooks/consultations/useCreateDiagnosis.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";

// ✅ Tipo actualizado para ICD-11
export interface CreateDiagnosisInput {
  appointment: number;
  icd_code: string;        // código ICD-11 oficial
  title?: string;          // descripción oficial OMS
  foundation_id?: string;  // ID único ICD-11
  description?: string;    // notas adicionales del médico
}

export function useCreateDiagnosis() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: CreateDiagnosisInput) => {
      return apiFetch("diagnoses/", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      // ✅ Invalida la consulta actual para refrescar diagnósticos
      queryClient.invalidateQueries({ queryKey: ["consultation", "current"] });
    },
  });

  return {
    ...mutation,
    isPending: mutation.isPending,
  };
}
