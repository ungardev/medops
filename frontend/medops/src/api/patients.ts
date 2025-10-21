import { apiFetch } from "./client";
import { Patient, PatientInput } from "../types/patients";

export const getPatients = () => apiFetch<Patient[]>("patients/");

export const createPatient = (data: PatientInput) =>
  apiFetch("patients/", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updatePatient = (id: number, data: PatientInput) =>
  apiFetch(`patients/${id}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const deletePatient = (id: number) =>
  apiFetch(`patients/${id}/`, {
    method: "DELETE",
  });
