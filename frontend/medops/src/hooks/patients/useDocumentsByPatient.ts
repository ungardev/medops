// src/hooks/useDocumentsByPatient.ts
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
import { MedicalDocument } from "../../types/documents";

interface DocumentsResult {
  list: MedicalDocument[];
  totalCount: number;
}

// 🔹 Ahora usamos el endpoint /documents/?patient={id}
async function fetchDocumentsByPatient(patientId: number): Promise<MedicalDocument[]> {
  return apiFetch<MedicalDocument[]>(`documents/?patient=${patientId}`);
}

export function useDocumentsByPatient(patientId: number) {
  return useQuery<MedicalDocument[], Error, DocumentsResult>({
    queryKey: ["documents", patientId],
    queryFn: () => fetchDocumentsByPatient(patientId),
    enabled: !!patientId,
    select: (data) => ({
      list: data,
      totalCount: data.length,
    }),
  });
}
