// src/api/patients.ts
import { apiFetch } from "./client";
import { Patient, PatientInput, PatientRef } from "../types/patients";

// 🔹 Obtener todos los pacientes (lista completa, sin paginación)
export const getPatients = (): Promise<Patient[]> =>
  apiFetch<Patient[]>("patients/");

// 🔹 Crear un nuevo paciente (con limpieza de payload)
export const createPatient = (data: PatientInput): Promise<Patient> => {
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

// 🔹 Actualizar un paciente existente (usar PATCH en lugar de PUT)
export const updatePatient = (id: number, data: PatientInput): Promise<Patient> => {
  const cleaned: any = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      cleaned[key] = value;
    }
  });

  return apiFetch<Patient>(`patients/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cleaned),
  });
};

// 🔹 Eliminar un paciente (con token institucional)
export const deletePatient = (id: number): Promise<void> =>
  apiFetch<void>(`patients/${id}/`, {
    method: "DELETE",
    headers: {
      Authorization: `Token ${import.meta.env.VITE_DEV_TOKEN}`, // 👈 clave de tu .env
    },
  });

// 🔹 Buscar pacientes (autocomplete / buscador)
//    Ahora devuelve { count, results } para alinearse con la paginación DRF
export interface PatientSearchResponse {
  count: number;
  results: PatientRef[];
}

export const searchPatients = (q: string): Promise<PatientSearchResponse> => {
  if (!q.trim()) return Promise.resolve({ count: 0, results: [] });
  return apiFetch<PatientSearchResponse>(`patients/search/?q=${encodeURIComponent(q)}`);
};

// 🔹 Obtener un paciente por ID
export const getPatient = (id: number): Promise<Patient> =>
  apiFetch<Patient>(`patients/${id}/`);
