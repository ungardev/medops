import { apiFetch } from "./client";
import { ConsultationNote } from "../types/consultation";

// 🔹 Obtener todas las notas de un paciente
export const getPatientNotes = (patientId: number): Promise<ConsultationNote[]> =>
  apiFetch<ConsultationNote[]>(`patients/${patientId}/notes/`);

// 🔹 Crear o actualizar una nota
export const updatePatientNotes = (
  patientId: number,
  content: string
): Promise<ConsultationNote> =>
  apiFetch<ConsultationNote>(`patients/${patientId}/notes/`, {
    method: "PATCH",
    body: JSON.stringify({ content }),
  });
