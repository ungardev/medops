import { PatientRef } from "./patients";
import { Appointment } from "./appointments";

// --- Estados de pago según el modelo Django ---
export type PaymentStatus = "pending" | "confirmed" | "rejected" | "void";

// --- Métodos de pago según el modelo Django ---
export type PaymentMethod = "cash" | "card" | "transfer" | "other";

export interface Payment {
  id: number;
  appointment: Appointment["id"];
  appointment_date: string; // YYYY-MM-DD
  patient: PatientRef;
  amount: string; // DRF devuelve Decimal como string
  method: PaymentMethod;
  status: PaymentStatus;
  reference_number?: string | null;
  bank_name?: string | null;
  received_by?: string | null;
  received_at?: string | null; // ISO string
}

// --- Datos de entrada para crear/editar pago ---
export interface PaymentInput {
  amount: string;
  method: PaymentMethod;
  status?: PaymentStatus;
  reference_number?: string;
  bank_name?: string;
  appointment?: number;   // ← ahora opcional
}

// --- Estados de ChargeOrder según el modelo Django ---
export type ChargeOrderStatus = "open" | "partially_paid" | "paid" | "void";

export interface ChargeItem {
  id: number;
  order: number;
  code: string;
  description: string;
  qty: number;
  unit_price: number;
  subtotal: number;
}

// --- Nueva entidad: Orden de Cobro ---
export interface ChargeOrder {
  id: number;
  appointment: Appointment["id"];
  patient: number; // en el payload base es ID
  currency: string;
  total: number;
  balance_due: number;
  status: ChargeOrderStatus;
  issued_at: string; // ISO datetime
  issued_by?: string | null;
  items: ChargeItem[];

  // --- Aliases del serializer extendido para Pagos ---
  appointment_date?: string; // alias de issued_at
  total_amount?: string | number; // alias de total
  patient_detail?: PatientRef; // objeto expandido con full_name
  payments?: Payment[];

  // --- Campos de auditoría ---
  created_at?: string | null;
  updated_at?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
}
