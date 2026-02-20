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
export interface GenerateDocumentsVariables {
  consultationId: number;
  patientId: number;
}
export function useGenerateConsultationDocuments() {
  const queryClient = useQueryClient();
  return useMutation<GenerateDocumentsResponse, Error, GenerateDocumentsVariables>({
    mutationFn: async ({ consultationId }) => {
      return apiFetch<GenerateDocumentsResponse>(
        `consultations/${consultationId}/generate-used-documents/`,
        { method: "POST" }
      );
    },
    onSuccess: (_data, variables) => {
      const { patientId, consultationId } = variables;
      
      // ✅ FIX: Invalidar TODAS las query keys relacionadas con documentos
      
      // 1. Invalidar PatientDocumentsTab (useDocumentsByPatient)
      queryClient.invalidateQueries({
        queryKey: ["patient-documents", patientId],
      });
      
      // 2. Invalidar DocumentsPanel (useDocuments) - con appointment
      queryClient.invalidateQueries({
        queryKey: ["documents", patientId, consultationId],
      });
      
      // 3. Invalidar DocumentsPanel (useDocuments) - sin appointment
      queryClient.invalidateQueries({
        queryKey: ["documents", patientId, undefined],
      });
      
      // 4. Invalidar appointment actual para reflejar cambios
      queryClient.invalidateQueries({
        queryKey: ["appointment", "current"],
      });
    },
  });
}