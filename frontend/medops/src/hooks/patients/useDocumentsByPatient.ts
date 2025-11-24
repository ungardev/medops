// src/hooks/patients/useDocumentsByPatient.ts
import { apiFetch } from "../../api/client";
import { MedicalDocument } from "../../types/documents";
import { useInstitutionalList } from "../core/useInstitutionalList";

export function useDocumentsByPatient(patientId: number) {
  return useInstitutionalList<MedicalDocument>(
    ["patient-documents", patientId],
    () => apiFetch(`patients/${patientId}/documents/`)
  );
}
