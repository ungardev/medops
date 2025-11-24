// src/hooks/patients/useDeleteDocument.ts
import { useMutation } from "@tanstack/react-query";

export function useDeleteDocument() {
  return useMutation({
    mutationFn: async (documentId: number) => {
      // ✅ usamos el endpoint global del router DRF
      const res = await fetch(`/api/documents/${documentId}/`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Error al eliminar el documento");
      return true; // DELETE devuelve 204 sin cuerpo
    },
  });
}
