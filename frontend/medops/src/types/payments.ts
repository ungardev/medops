import { PatientRef } from "./patients";
import { Appointment } from "./appointments";

export interface Payment {
  id: number;
  appointment: Appointment["id"];   // referencia a la cita
  appointment_date: string;         // YYYY-MM-DD
  patient: PatientRef;              // 👈 objeto con id y name
  amount: string;
  method: "cash" | "card" | "transfer" | "other"; // ajusta según tu dominio
  status: "pending" | "paid" | "waived";
  reference_number?: string | null;
  bank_name?: string | null;
  received_by?: string | null;
  received_at?: string | null;      // ISO string
}

// --- Datos de entrada para crear/editar pago
export interface PaymentInput {
  appointment: number;
  amount: string;
  method: string;
  status?: "pending" | "paid" | "waived";
  reference_number?: string;
  bank_name?: string;
}
