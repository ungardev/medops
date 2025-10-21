import { apiFetch } from "./client";
import { WaivedConsultation, WaivedConsultationInput } from "types/waivedConsultations";

export const getWaivedConsultations = () =>
  apiFetch<WaivedConsultation[]>("waived-consultations/");

export const createWaivedConsultation = (data: WaivedConsultationInput) =>
  apiFetch("waived-consultations/", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateWaivedConsultation = (id: number, data: WaivedConsultationInput) =>
  apiFetch(`waived-consultations/${id}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const deleteWaivedConsultation = (id: number) =>
  apiFetch(`waived-consultations/${id}/`, {
    method: "DELETE",
  });
