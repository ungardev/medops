// src/hooks/patients/useDeleteDocument.ts
import { useMutation } from "@tanstack/react-query";

export function useDeleteDocument(patientId: number) {
  return useMutation({
    mutationFn: async (documentId: number) => {
      const res = await fetch(`/api/patients/${patientId}/documents/${documentId}/`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Error al eliminar el documento");
      return true;
    },
  });
}
