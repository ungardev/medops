// src/api/patients.ts
import { apiFetch } from "./client";
import {
  Patient,
  PatientInput,
  PatientRef,
  PatientClinicalProfile,
} from "../types/patients";

// 🔹 Obtener pacientes activos con paginación (blindaje contra inactivos)
export const getPatients = (page = 1, pageSize = 20): Promise<Patient[]> =>
  apiFetch<any>(`patients/?page=${page}&page_size=${pageSize}`).then((res) => {
    // DRF clásico: { count, results, next, previous }
    if (res && Array.isArray(res.results)) {
      return res.results as Patient[];
    }
    // Fallback seguro
    return Array.isArray(res) ? (res as Patient[]) : [];
  });

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
// ⚔️ Ahora acepta PATCH parciales y devuelve perfil clínico completo
export const updatePatient = (
  id: number,
  data: Partial<PatientInput>
): Promise<PatientClinicalProfile> => {
  const cleaned: any = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      cleaned[key] = value;
    }
  });

  return apiFetch<PatientClinicalProfile>(`patients/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cleaned),
  });
};

// 🔹 Eliminar un paciente (soft delete institucional)
// ⚔️ Ahora con trazas para confirmar ejecución
export const deletePatient = async (id: number): Promise<void> => {
  console.log("[API] intentando DELETE /patients/" + id + "/");
  await apiFetch<void>(`patients/${id}/`, { method: "DELETE" });
  console.log("[API] DELETE completado para paciente " + id);
};

// 🔹 Buscar pacientes (autocomplete / buscador)
export interface PatientSearchResponse {
  count: number;
  results: PatientRef[];
}

export const searchPatients = (q: string): Promise<PatientSearchResponse> => {
  if (!q.trim()) return Promise.resolve({ count: 0, results: [] });
  // ⚔️ Blindaje institucional: solo pacientes activos
  return apiFetch<PatientSearchResponse>(
    `patients/search/?q=${encodeURIComponent(q)}&active=true`
  );
};

// 🔹 Obtener un paciente por ID
export const getPatient = (id: number): Promise<PatientClinicalProfile> =>
  apiFetch<PatientClinicalProfile>(`patients/${id}/`);
