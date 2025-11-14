import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";

// 🔹 Response type for consultation documents generation
export interface GenerateDocumentsResponse {
  generated: string[];
  skipped: string[];
  message: string;
}

// 🔹 Hook for generating consultation documents
export function useGenerateConsultationDocuments(): UseMutationResult<
  GenerateDocumentsResponse,
  Error,
  number
> {
  return useMutation<GenerateDocumentsResponse, Error, number>({
    mutationFn: async (consultationId: number): Promise<GenerateDocumentsResponse> => {
      return apiFetch<GenerateDocumentsResponse>(
        `consultations/${consultationId}/generate-used-documents/`,
        {
          method: "POST",
        }
      );
    },
  });
}
