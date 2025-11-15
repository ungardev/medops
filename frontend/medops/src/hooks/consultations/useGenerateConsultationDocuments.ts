import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";

// 🔹 Tipos de documentos generados
export interface GeneratedDocument {
  id: number;
  category: string;
  description: string;
  file_url: string;
}

// 🔹 Respuesta del endpoint
export interface GenerateDocumentsResponse {
  generated: GeneratedDocument[];
  skipped: string[];
  message: string;
}

// 🔹 Hook para generar documentos de consulta
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

