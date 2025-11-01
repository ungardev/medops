import { useQuery } from "@tanstack/react-query";
import { PatientRef } from "../../types/patients";
import { Payment } from "../../types/payments";

// 🔹 Tipo de cita pendiente
export interface AppointmentPending {
  id: number;
  appointment_date: string;        // YYYY-MM-DD
  expected_amount: string;         // total esperado de la consulta
  patient: PatientRef;             // { id, full_name }
  payments?: Payment[];            // micropagos asociados (si backend los devuelve)
  financial_status: "pending" | "paid"; // 👈 nuevo campo derivado en backend
}

// 🔹 Fetcher
async function fetchAppointmentsPending(): Promise<AppointmentPending[]> {
  const res = await fetch("/api/appointments/pending/");
  if (!res.ok) {
    throw new Error("Error al cargar citas pendientes");
  }
  return res.json();
}

// 🔹 Hook
export function useAppointmentsPending() {
  return useQuery<AppointmentPending[]>({
    queryKey: ["appointments", "pending"],
    queryFn: fetchAppointmentsPending,
  });
}
