// src/hooks/patients/useUploadDocument.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
import { MedicalDocument } from "../../types/documents";

interface UploadPayload {
  file: File;
  description?: string;
  category?: string;
}

export function useUploadDocument(patientId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, description, category }: UploadPayload) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("patient", String(patientId)); // 👈 necesario para el ViewSet
      if (description) formData.append("description", description);
      if (category) formData.append("category", category);

      return apiFetch<MedicalDocument>("documents/", {
        method: "POST",
        body: formData,
      });
    },
    onSuccess: () => {
      // 🔹 Invalida la cache de documentos del paciente
      queryClient.invalidateQueries({ queryKey: ["documents", patientId] });
    },
  });
}
