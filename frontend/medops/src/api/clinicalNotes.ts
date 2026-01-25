// src/api/clinicalNotes.ts
import { apiFetch } from "./client";
import { ClinicalNote, CreateClinicalNoteInput, UpdateClinicalNoteInput } from "../types/clinical";
// 🔹 Obtener nota clínica de una cita
export const getClinicalNote = (appointmentId: number) =>
  apiFetch<ClinicalNote>(`appointments/${appointmentId}/clinical-note/`);
// 🔹 Crear nota clínica para una cita
export const createClinicalNote = (appointmentId: number, data: CreateClinicalNoteInput) =>
  apiFetch<ClinicalNote>(`appointments/${appointmentId}/clinical-note/`, {
    method: "POST",
    body: JSON.stringify(data),
  });
// 🔹 Actualizar nota clínica
export const updateClinicalNote = (id: number, data: UpdateClinicalNoteInput) =>
  apiFetch<ClinicalNote>(`clinical-notes/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
// 🔹 Bloquear nota clínica (prevenir cambios)
export const lockClinicalNote = (id: number) =>
  apiFetch<ClinicalNote>(`clinical-notes/${id}/lock/`, {
    method: "POST",
  });
// 🔹 Desbloquear nota clínica
export const unlockClinicalNote = (id: number) =>
  apiFetch<ClinicalNote>(`clinical-notes/${id}/unlock/`, {
    method: "POST",
  });
