import { apiFetch } from "./client";
import { Patient, PatientInput } from "../types/patients";

// 🔹 Obtener todos los pacientes
export const getPatients = () => apiFetch<Patient[]>("patients/");

// 🔹 Crear un nuevo paciente
export const createPatient = (data: PatientInput) =>
  apiFetch("patients/", {
    method: "POST",
    body: JSON.stringify(data),
  });

// 🔹 Actualizar un paciente existente
export const updatePatient = (id: number, data: PatientInput) =>
  apiFetch(`patients/${id}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

// 🔹 Eliminar un paciente
export const deletePatient = (id: number) =>
  apiFetch(`patients/${id}/`, {
    method: "DELETE",
  });

// 🔹 Buscar pacientes (para autocomplete en Sala de Espera)
export const searchPatients = (q: string) =>
  apiFetch<Patient[]>(`patients/search/?q=${encodeURIComponent(q)}`);
