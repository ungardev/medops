import { useQuery } from "@tanstack/react-query";
import { PatientRef } from "../../types/patients";
import { Payment } from "../../types/payments";
export interface AppointmentPending {
  id: number;
  appointment_date: string;
  expected_amount: string;
  patient: PatientRef;
  payments?: Payment[];
  financial_status: "pending" | "paid";
}
// ✅ CORREGIDO: Enviar token de autenticación
async function fetchAppointmentsPending(): Promise<AppointmentPending[]> {
  const token = localStorage.getItem('authToken') || localStorage.getItem('patient_drf_token') || '';
  
  const res = await fetch("/api/appointments/pending/", {
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!res.ok) {
    throw new Error("Error al cargar citas pendientes");
  }
  
  return res.json();
}
export function useAppointmentsPending() {
  return useQuery<AppointmentPending[]>({
    queryKey: ["appointments", "pending"],
    queryFn: fetchAppointmentsPending,
    refetchInterval: 30000, // Refrescar cada 30 segundos
  });
}