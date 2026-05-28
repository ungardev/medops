// src/types/payments.ts
import type { IdentityPatient, IdentityDoctor, IdentityInstitution } from "./identity";

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
  PAGO_MOVIL = "pago_movil",
}

export enum ChargeOrderStatus {
  OPEN = "open",
  PARTIALLY_PAID = "partially_paid",
  PAID = "paid",
  VOID = "void",
  WAIVED = "waived",
}

export interface ChargeItem {
  id: number;
  order: number;
  code: string;
  description?: string | null;
  qty: number;
  unit_price: number;
  subtotal: number;
}

export interface Payment {
  id: number;
  institution: IdentityInstitution;
  appointment: number;
  charge_order: number;
  doctor: IdentityDoctor;
  amount: number | string;
  currency: string;
  method: PaymentMethod;
  method_display?: string;
  status: PaymentStatus;
  status_display?: string;
  gateway_transaction_id?: string | null;
  reference_number?: string | null;
  bank_name?: string | null;
  detail?: string | null;
  gateway_response_raw?: Record<string, any>;
  received_by?: number | null;
  received_at?: string | null;
  cleared_at?: string | null;
  idempotency_key?: string | null;
  patient_name?: string;
  appointment_date?: string;
  patient?: IdentityPatient;
}

export interface PaymentExtended extends Payment {
  appointment_date?: string;
}

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

export interface ChargeOrder {
  id: number;
  appointment: number;
  patient: number;
  patient_name?: string;
  patient_detail?: IdentityPatient;
  institution: IdentityInstitution;
  doctor: IdentityDoctor;
  currency: string;
  total: number;
  balance_due: number;
  status: ChargeOrderStatus;
  status_display?: string;
  items: ChargeItem[];
  payments: any[];
  issued_at: string;
  issued_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  created_by?: number | null;
  updated_by?: number | null;
  appointment_date?: string;
  total_amount?: string | number;
}

export interface PendingPayment {
  id: number;
  amount: number;
  amount_ves: number | null;
  exchange_rate_bcv: number | null;
  method: string;
  method_display: string;
  status: string;
  reference_number: string;
  bank_reference: string;
  detail: string;
  verification_type: 'automatic' | 'manual' | null;
  created_at: string;
  screenshot?: string;
  charge_order: {
    id: number;
    doctor: {
      id: number;
      full_name: string;
    } | null;
    institution: {
      id: number;
      name: string;
    } | null;
    patient: {
      id: number;
      full_name: string;
      national_id: string;
    };
    items: Array<{
      id: number;
      doctor_service: {
        id: number;
        name: string;
      } | null;
    }>;
    total: number;
    balance_due: number;
  };
  patient: {
    id: number;
    full_name: string;
    national_id: string;
  };
}

export interface VerifyPaymentInput {
  action: 'confirm' | 'reject';
  notes?: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  payment: {
    id: number;
    status: string;
    verified_by: string | null;
    verified_at: string | null;
    verification_notes: string;
    message: string;
  };
}

export interface DoctorWallet {
  id: number;
  doctor: number;
  doctor_name: string;
  balance: string;
  pending_balance: string;
  total_earned: string;
  total_disbursed: string;
  last_disbursement_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Disbursement {
  id: number;
  doctor: number;
  doctor_name: string;
  reference: string;
  bancaribe_reference: string;
  amount: string;
  currency: string;
  amount_ves: string | null;
  bank_code: string;
  bank_account: string;
  bank_reference: string;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  status_display: string;
  disbursement_type: "instant" | "scheduled" | "batch";
  type_display: string;
  doctor_wallet: number | null;
  scheduled_at: string | null;
  processed_at: string | null;
  completed_at: string | null;
  error_message: string;
  raw_response: any;
  created_at: string;
  updated_at: string;
}
