// src/types/payments.ts
// =====================================================
// IMPORTAR TIPOS DE IDENTIDAD DESDE identity.ts
// =====================================================
import type { IdentityPatient, IdentityDoctor, IdentityInstitution } from "./identity";
// =====================================================
// ENUMS - Alineados con backend
// =====================================================
export enum PaymentStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  REJECTED = "rejected",
  VOID = "void",
}
export enum PaymentMethod {
  CASH = "cash",
  CARD = "card",
  TRANSFER = "transfer",
  ZELLE = "zelle",
  CRYPTO = "crypto",
  OTHER = "other",
}
export enum ChargeOrderStatus {
  OPEN = "open",
  PARTIALLY_PAID = "partially_paid",
  PAID = "paid",
  VOID = "void",
  WAIVED = "waived",
}
// =====================================================
// ÍTEM DE COBRO
// =====================================================
export interface ChargeItem {
  id: number;
  order: number;
  code: string;
  description?: string | null;
  qty: number;
  unit_price: number;
  subtotal: number;
}
// =====================================================
// PAGO
// =====================================================
export interface Payment {
  id: number;
  
  // Relaciones
  institution: IdentityInstitution;
  appointment: number;
  charge_order: number;
  doctor: IdentityDoctor;
  
  // Transacción
  amount: number | string;
  currency: string;
  method: PaymentMethod;
  method_display?: string;
  status: PaymentStatus;
  status_display?: string;
  
  // Trazabilidad Fintech
  gateway_transaction_id?: string | null;
  reference_number?: string | null;
  bank_name?: string | null;
  detail?: string | null;
  gateway_response_raw?: Record<string, any>;
  
  // Auditoría
  received_by?: number | null;
  received_at?: string | null;
  cleared_at?: string | null;
  idempotency_key?: string | null;
  
  // Display
  patient_name?: string;
}
// =====================================================
// PAGO EXTENDIDO (para UI)
// =====================================================
export interface PaymentExtended extends Payment {
  appointment_date?: string;
}
// =====================================================
// DATOS DE ENTRADA PARA CREAR/EDITAR PAGO
// =====================================================
export interface PaymentInput {
  amount: string;
  method: PaymentMethod;
  status?: PaymentStatus;
  reference_number?: string;
  bank_name?: string;
  detail?: string;
  charge_order: number;
  appointment?: number;
}
// =====================================================
// ORDEN DE COBRO
// =====================================================
export interface ChargeOrder {
  id: number;
  
  // Relaciones
  appointment: number;
  patient: number;
  patient_name?: string;
  patient_detail?: IdentityPatient;
  institution: IdentityInstitution;
  doctor: IdentityDoctor;
  
  // Monetización
  currency: string;
  total: number;
  balance_due: number;
  status: ChargeOrderStatus;
  status_display?: string;
  
  // Items y pagos
  items: ChargeItem[];
  payments: any[];
  
  // Auditoría
  issued_at: string;
  issued_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  created_by?: number | null;
  updated_by?: number | null;
  
  // Alias para pagos
  appointment_date?: string;
  total_amount?: string | number;
}