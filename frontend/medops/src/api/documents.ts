import { apiFetch } from "./client";
// =====================================================
// IMPORTAR TIPO CANÓNICO
// =====================================================
import type { MedicalDocument } from "../types/documents";
// 🔹 Obtener documentos de un paciente
export const getDocumentsByPatient = (patientId: number) =>
  apiFetch<MedicalDocument[]>(`patients/${patientId}/documents/`);
// 🔹 Subir un nuevo documento
export const uploadDocument = (patientId: number, formData: FormData) =>
  apiFetch<MedicalDocument>(`patients/${patientId}/documents/`, {
    method: "POST",
    body: formData,
  });