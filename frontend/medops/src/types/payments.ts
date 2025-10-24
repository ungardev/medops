// src/types/payments.ts

export interface Payment {
  id: number;
  appointment: number | null;        // id de la cita asociada
  appointment_date?: string;         // fecha de la cita
  patient_id?: number;               // 🔹 id del paciente
  patient_name?: string;             // nombre del paciente
  amount: string;                    // decimal como string
  method: "cash" | "card" | "transfer";
  status: "pending" | "paid" | "canceled" | "waived";
  reference_number?: string | null;
  bank_name?: string | null;
  received_by?: string | null;
  received_at?: string;              // ISO datetime
}

export interface PaymentInput {
  appointment: number;
  patient_id: number;                // 🔹 id del paciente requerido
  amount: string;                    // mantener como string para backend
  method: "cash" | "card" | "transfer";
  status?: "pending" | "paid" | "canceled" | "waived";
  reference_number?: string;
  bank_name?: string;
  received_by?: string;
  received_at?: string;              // opcional si quieres setear fecha manual
}
