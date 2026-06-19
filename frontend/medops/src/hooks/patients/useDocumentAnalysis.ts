// src/hooks/patients/useDocumentAnalysis.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { analyzeDocument, getDocumentAnalysis, getPatientAnalyses, type AIAnalysisResult } from "@/api/diagnosis";

export function useDocumentAnalysis(documentId: number | null) {
  return useQuery({
    queryKey: ["document-analysis", documentId],
    queryFn: () => (documentId ? getDocumentAnalysis(documentId) : null),
    enabled: documentId !== null,
  });
}

export function useDocumentAnalysisForExpand(documentId: number | null) {
  const queryState = useQuery({
    queryKey: ["document-analysis", documentId],
    queryFn: () => (documentId ? getDocumentAnalysis(documentId) : null),
    enabled: documentId !== null,
  });
  return {
    analysis: queryState.data,
    isFetching: queryState.isFetching,
  };
}

export function usePatientAnalyses(patientId: number | null, limit: number = 20) {
  return useQuery({
    queryKey: ["patient-analyses", patientId, limit],
    queryFn: () => (patientId ? getPatientAnalyses(patientId, limit) : null),
    enabled: patientId !== null,
  });
}

export function useAnalyzeDocument(patientId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      documentId,
      model,
      analysisMode,
    }: {
      documentId: number;
      model?: string;
      analysisMode?: string;
    }) => analyzeDocument(documentId, model, analysisMode),
    onSuccess: (data: AIAnalysisResult) => {
      queryClient.setQueryData(
        ["document-analysis", data.document],
        data
      );
      queryClient.invalidateQueries({
        queryKey: ["patient-analyses", data.patient],
      });
    },
  });
}
