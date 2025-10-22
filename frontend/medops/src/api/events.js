import { apiFetch } from "./client";
export const getEvents = () => apiFetch("events/");
export const createEvent = (data) => apiFetch("events/", {
    method: "POST",
    body: JSON.stringify(data),
});
export const updateEvent = (id, data) => apiFetch(`events/${id}/`, {
    method: "PUT",
    body: JSON.stringify(data),
});
export const deleteEvent = (id) => apiFetch(`events/${id}/`, {
    method: "DELETE",
});
