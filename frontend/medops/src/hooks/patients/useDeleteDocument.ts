// src/hooks/patients/useDeleteDocument.ts
import { useMutation } from "@tanstack/react-query";

// 👇 API root correcto
const API_ROOT = "http://127.0.0.1/api";

// 👇 tu token fijo (puedes moverlo a .env si prefieres)
const TOKEN = "6d6bb3a135ac1ba88ff4502ecd8c1c697847ee89";

export function useDeleteDocument() {
  return useMutation({
    mutationFn: async (documentId: number) => {
      const res = await fetch(`${API_ROOT}/documents/${documentId}/`, {
        method: "DELETE",
        headers: {
          "Authorization": `Token ${TOKEN}`, // 👈 DRF TokenAuth
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) throw new Error("Error al eliminar el documento");
      return true; // DELETE devuelve 204 sin cuerpo
    },
  });
}
