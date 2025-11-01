import { PatientRef } from "./patients";
import { Appointment } from "./appointments";

// --- Estados de pago según el modelo Django ---
export type PaymentStatus = "pending" | "paid" | "canceled" | "waived";

// --- Métodos de pago según el modelo Django ---
export type PaymentMethod = "cash" | "card" | "transfer";

export interface Payment {
  id: number;
  appointment: Appointment["id"];   // referencia a la cita
  appointment_date: string;         // YYYY-MM-DD
  patient: PatientRef;              // objeto con id y nombre
  amount: string;                   // DRF devuelve Decimal como string
  method: PaymentMethod;
  status: PaymentStatus;
  reference_number?: string | null;
  bank_name?: string | null;
  received_by?: string | null;
  received_at?: string | null;      // ISO string
}

// --- Datos de entrada para crear/editar pago ---
export interface PaymentInput {
  appointment: number;
  amount: string;
  method: PaymentMethod;
  status?: PaymentStatus;
  reference_number?: string;
  bank_name?: string;
}
