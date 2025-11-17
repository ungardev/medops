// src/hooks/consultations/useGenerateConsultationDocuments.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";

export interface GeneratedDocument {
  id: number;
  category: string;
  description: string;
  file_url: string;
}

export interface GenerateDocumentsResponse {
  generated: GeneratedDocument[];
  skipped: string[];
  message: string;
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
