// src/hooks/patients/useDeleteDocument.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

// 👇 API root correcto con puerto
const API_ROOT = "http://127.0.0.1:8000/api";

// 👇 tu token fijo (ideal moverlo a .env)
const TOKEN = "6d6bb3a135ac1ba88ff4502ecd8c1c697847ee89";

export function useDeleteDocument(patientId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: number) => {
      const res = await fetch(`${API_ROOT}/patients/${patientId}/documents/${documentId}/`, {
        method: "DELETE",
        headers: {
          "Authorization": `Token ${TOKEN}`,
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) throw new Error("Error al eliminar el documento");
      return true; // DELETE devuelve 204 sin cuerpo
    },
    onSuccess: () => {
      // invalidar cache de documentos del paciente
      queryClient.invalidateQueries({ queryKey: ["patient-documents", patientId] });
    },
  });
}
