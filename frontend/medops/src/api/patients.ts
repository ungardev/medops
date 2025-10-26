// src/api/patients.ts
import { apiFetch } from "./client";
import { Patient, PatientInput, PatientRef } from "../types/patients";

// 🔹 Obtener todos los pacientes
export const getPatients = (): Promise<Patient[]> =>
  apiFetch<Patient[]>("patients/");

// 🔹 Crear un nuevo paciente (con limpieza de payload)
export const createPatient = (data: PatientInput): Promise<Patient> => {
  // limpiar payload: quitar campos vacíos o nulos
  const cleaned: any = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      cleaned[key] = value;
    }
  });

  return apiFetch<Patient>("patients/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cleaned),
  });
};

// 🔹 Actualizar un paciente existente
export const updatePatient = (id: number, data: PatientInput): Promise<Patient> => {
  // limpiar payload también en update
  const cleaned: any = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      cleaned[key] = value;
    }
  });

  return apiFetch<Patient>(`patients/${id}/`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cleaned),
  });
};

// 🔹 Eliminar un paciente
export const deletePatient = (id: number): Promise<void> =>
  apiFetch<void>(`patients/${id}/`, {
    method: "DELETE",
  });

// 🔹 Buscar pacientes (para autocomplete en Sala de Espera o buscador en portal)
//    Permite buscar por nombre o por ID, con debounce en el frontend
export const searchPatients = (q: string): Promise<PatientRef[]> => {
  if (!q.trim()) return Promise.resolve([]);
  return apiFetch<PatientRef[]>(`patients/search/?q=${encodeURIComponent(q)}`);
};

// 🔹 Obtener un paciente por ID
export const getPatient = (id: number): Promise<Patient> =>
  apiFetch<Patient>(`patients/${id}/`);
