// src/api/vitalSigns.ts
import { apiFetch } from "./client";
import { VitalSigns, CreateVitalSignsInput, UpdateVitalSignsInput } from "../types/clinical";
// 🔹 Obtener signos vitales de una cita
export const getVitalSigns = (appointmentId: number) => 
  apiFetch<VitalSigns>(`appointments/${appointmentId}/vital-signs/`);
// 🔹 Crear signos vitales para una cita
export const createVitalSigns = (appointmentId: number, data: CreateVitalSignsInput) =>
  apiFetch<VitalSigns>(`appointments/${appointmentId}/vital-signs/`, {
    method: "POST",
    body: JSON.stringify(data),
  });
// 🔹 Actualizar signos vitales
export const updateVitalSigns = (id: number, data: UpdateVitalSignsInput) =>
  apiFetch<VitalSigns>(`vital-signs/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
// 🔹 Eliminar signos vitales
export const deleteVitalSigns = (id: number) =>
  apiFetch<void>(`vital-signs/${id}/`, {
    method: "DELETE",
  });
