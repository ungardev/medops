import { apiFetch } from "./client";
import { ClinicEvent, ClinicEventInput } from "types/events";

export const getEvents = () => apiFetch<ClinicEvent[]>("events/");

export const createEvent = (data: ClinicEventInput) =>
  apiFetch("events/", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateEvent = (id: number, data: ClinicEventInput) =>
  apiFetch(`events/${id}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const deleteEvent = (id: number) =>
  apiFetch(`events/${id}/`, {
    method: "DELETE",
  });
