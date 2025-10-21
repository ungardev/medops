import { apiFetch } from "./client";
import { Appointment, AppointmentInput } from "../types/appointments";

// --- Citas ---
export const getAppointments = () => apiFetch<Appointment[]>("appointments/");

export const createAppointment = (data: AppointmentInput) =>
  apiFetch("appointments/", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateAppointment = (id: number, data: AppointmentInput) =>
  apiFetch(`appointments/${id}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const deleteAppointment = (id: number) =>
  apiFetch(`appointments/${id}/`, {
    method: "DELETE",
  });

// 🔹 Obtener detalle de una cita por ID
export const fetchAppointmentDetail = (id: number) =>
  apiFetch<Appointment>(`appointments/${id}/`);

// 🔹 Actualizar solo el estado de una cita
export const updateAppointmentStatus = (id: number, newStatus: string) =>
  apiFetch<Appointment>(`appointments/${id}/`, {
    method: "PATCH",
    body: JSON.stringify({ status: newStatus }),
  });

// --- Dashboard ---
export interface DashboardSummary {
  total_patients: number;
  total_appointments: number;
  completed_appointments: number;
  pending_appointments: number;
  total_payments: number;
  total_events: number;
  total_waived: number;
  total_payments_amount: number;
  estimated_waived_amount: number;
  financial_balance: number;

  // 🔹 Nuevos campos de tendencias
  appointments_trend: { month: string; citas: number }[];
  payments_trend: { week: string; pagos: number }[];
  balance_trend: { week: string; balance: number }[];
}

// 🔹 Obtener resumen del dashboard con filtros opcionales
export const getDashboardSummary = (
  startDate?: string,
  endDate?: string,
  status?: string
) => {
  const params = new URLSearchParams();
  if (startDate) params.append("start_date", startDate);
  if (endDate) params.append("end_date", endDate);
  if (status) params.append("status", status);

  return apiFetch<DashboardSummary>(
    `dashboard/summary/${params.toString() ? "?" + params.toString() : ""}`
  );
};
