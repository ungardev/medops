// src/api/patients.ts
import { apiFetch } from "./client";
import { Patient, PatientInput, PatientRef } from "../types/patients";

// 🔹 Obtener todos los pacientes
export const getPatients = (): Promise<Patient[]> =>
  apiFetch<Patient[]>("patients/");

// 🔹 Crear un nuevo paciente
export const createPatient = (data: PatientInput): Promise<Patient> =>
  apiFetch<Patient>("patients/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

// 🔹 Actualizar un paciente existente
export const updatePatient = (id: number, data: PatientInput): Promise<Patient> =>
  apiFetch<Patient>(`patients/${id}/`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

// 🔹 Eliminar un paciente
export const deletePatient = (id: number): Promise<void> =>
  apiFetch<void>(`patients/${id}/`, {
    method: "DELETE",
  });

// 🔹 Buscar pacientes (para autocomplete en Sala de Espera o buscador en portal)
export const searchPatients = (q: string): Promise<PatientRef[]> =>
  apiFetch<PatientRef[]>(`patients/search/?q=${encodeURIComponent(q)}`);

// 🔹 Obtener un paciente por ID
export const getPatient = (id: number): Promise<Patient> =>
  apiFetch<Patient>(`patients/${id}/`);
