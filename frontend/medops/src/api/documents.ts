import { apiFetch } from "./client";

export interface MedicalDocument {
  id: number;
  patient: number;
  appointment?: number | null;
  diagnosis?: number | null;
  file: string; // URL del archivo
  description?: string | null;
  category?: string | null;
  uploaded_at: string;
  uploaded_by?: string | null;
}

// 🔹 Obtener documentos de un paciente
export const getDocumentsByPatient = (patientId: number) =>
  apiFetch<MedicalDocument[]>(`patients/${patientId}/documents/`);

// 🔹 Subir un nuevo documento
export const uploadDocument = (patientId: number, formData: FormData) =>
  apiFetch<MedicalDocument>(`patients/${patientId}/documents/`, {
    method: "POST",
    body: formData,
  });
