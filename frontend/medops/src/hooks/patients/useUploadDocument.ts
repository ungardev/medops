// src/hooks/patients/useUploadDocument.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
import { MedicalDocument } from "../../types/documents";

interface UploadPayload {
  file: File;
  description?: string;
  category?: string;
  visibility?: "doctor_only" | "doctor_institution" | "patient_visible" | "public";
}

export function useUploadDocument(patientId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, description, category, visibility }: UploadPayload) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("patient", String(patientId));
      if (description) formData.append("description", description);
      if (category) formData.append("category", category);
      if (visibility) formData.append("visibility", visibility);
      return apiFetch<MedicalDocument>(`patients/${patientId}/documents`, {
        method: "POST",
        body: formData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-documents", patientId] });
    },
  });
}