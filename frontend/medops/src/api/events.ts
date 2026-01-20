// src/api/events.ts
import { apiFetch } from "./client";
import { Event, CreateEventInput } from "types/events";
export const getEvents = () => apiFetch<Event[]>("events/");
export const createEvent = (data: CreateEventInput) =>
  apiFetch("events/", {
    method: "POST",
    body: JSON.stringify(data),
  });
export const updateEvent = (id: number, data: CreateEventInput) =>
  apiFetch(`events//`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
export const deleteEvent = (id: number) =>
  apiFetch(`events//`, {
    method: "DELETE",
  });