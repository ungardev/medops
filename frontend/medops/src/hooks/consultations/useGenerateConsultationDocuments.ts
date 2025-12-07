// src/hooks/consultations/useGenerateConsultationDocuments.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";

export interface GeneratedDocument {
  category: string;
  title: string;
  filename: string | null;
  audit_code: string;
  file_url: string | null;
}

export interface GenerateDocumentsResponse {
  consultation_id: number;
  audit_code: string | null;
  generated_at: string;
  documents: GeneratedDocument[];
  skipped: string[];
  errors: { category: string; error: string }[];
}

export function useGenerateConsultationDocuments() {
  const queryClient = useQueryClient();

  return useMutation<GenerateDocumentsResponse, Error, number>({
    mutationFn: async (consultationId: number) => {
      return apiFetch<GenerateDocumentsResponse>(
        `consultations/${consultationId}/generate-used-documents/`,
        { method: "POST" }
      );
    },
    onSuccess: (_data, consultationId) => {
      queryClient.invalidateQueries({
        queryKey: ["documents", undefined, consultationId],
      });
    },
  });
}
