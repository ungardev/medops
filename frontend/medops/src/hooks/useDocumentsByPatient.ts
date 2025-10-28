// src/hooks/useDocumentsByPatient.ts
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../api/client";

export interface MedicalDocument {
  id: number;
  description?: string;
  category?: string;
  uploaded_at: string;
  uploaded_by?: string;
  file: string; // URL del archivo
}

async function fetchDocumentsByPatient(patientId: number): Promise<MedicalDocument[]> {
  return apiFetch(`patients/${patientId}/documents/`);
}

export function useDocumentsByPatient(patientId: number) {
  return useQuery<MedicalDocument[]>({
    queryKey: ["documents", patientId],
    queryFn: () => fetchDocumentsByPatient(patientId),
    enabled: !!patientId,
  });
}
