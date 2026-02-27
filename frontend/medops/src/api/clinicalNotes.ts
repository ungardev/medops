// src/api/clinicalNotes.ts
import { apiFetch } from "./client";
import { ClinicalNote, CreateClinicalNoteInput, UpdateClinicalNoteInput } from "../types/clinical";
// Obtener nota clínica de una cita
export const getClinicalNote = (appointmentId: number) =>
  apiFetch<ClinicalNote>(`appointments/${appointmentId}/clinical-note/`);
// Crear nota clínica para una cita
export const createClinicalNote = (appointmentId: number, data: CreateClinicalNoteInput) =>
  apiFetch<ClinicalNote>(`appointments/${appointmentId}/clinical-note/`, {
    method: "POST",
    body: JSON.stringify(data),
  });
// Actualizar nota clínica (CORREGIDO: usa appointments endpoint)
export const updateClinicalNote = (appointmentId: number, data: UpdateClinicalNoteInput) =>
  apiFetch<ClinicalNote>(`appointments/${appointmentId}/clinical-note/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
// Bloquear nota clínica - USA EL ENDPOINT EXISTENTE: /lock/
export const lockClinicalNote = (appointmentId: number) =>
  apiFetch<ClinicalNote>(`appointments/${appointmentId}/clinical-note/lock/`, {
    method: "POST",
    body: JSON.stringify({ action: "lock" }),
  });
// Desbloquear nota clínica - USA EL MISMO ENDPOINT: /lock/
export const unlockClinicalNote = (appointmentId: number) =>
  apiFetch<ClinicalNote>(`appointments/${appointmentId}/clinical-note/lock/`, {
    method: "POST",
    body: JSON.stringify({ action: "unlock" }),
  });