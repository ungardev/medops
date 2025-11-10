// src/hooks/consultations/useCreateDiagnosis.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";

// ✅ Tipo actualizado para ICD-11
export interface CreateDiagnosisInput {
  appointment: number;     // id de la cita (obligatorio)
  icd_code: string;        // código ICD-11 oficial (obligatorio)
  title: string;           // descripción oficial OMS (obligatorio en modelo)
  foundation_id?: string;  // 👈 corregido: en tu modelo es CharField, no number
  description?: string;    // notas adicionales del médico
}

export function useCreateDiagnosis() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: CreateDiagnosisInput) => {
      // Logging defensivo para inspección
      console.log("Payload diagnóstico:", data);

      // ❗ Importante: no anteponer /api si apiFetch ya lo añade
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
