// src/hooks/patients/useDeleteDocument.ts
import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";

export function useDeleteDocument() {
  return useMutation({
    mutationFn: async (documentId: number) => {
      return apiFetch<void>(`documents/${documentId}/`, {
        method: "DELETE",
      });
    },
  });
}
