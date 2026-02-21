// src/hooks/patients/useDeleteDocument.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client"; // 🔧 FIX: Usar apiFetch consistente
export function useDeleteDocument(patientId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (documentId: number) => {
      // 🔧 FIX: Usar apiFetch con autenticación automática y endpoint correcto
      return apiFetch(`patients/${patientId}/documents/${documentId}/`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      // invalidar cache de documentos del paciente
      queryClient.invalidateQueries({ queryKey: ["patient-documents", patientId] });
    },
  });
}