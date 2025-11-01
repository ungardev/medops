// src/utils/payments.ts
import { Payment, PaymentInput } from "../types/payments";

export function toPaymentInputPartial(p: Partial<Payment>): Partial<PaymentInput> {
  const out: Partial<PaymentInput> = {};

  // Campos compatibles
  if (p.appointment != null) out.appointment = p.appointment;
  if (p.amount != null) out.amount = String(p.amount); // aseguramos string
  if (p.method != null) out.method = p.method as PaymentInput["method"];
  if (p.status != null) out.status = p.status as PaymentInput["status"];

  // Nullables: convertir null → undefined
  if (p.reference_number !== undefined) {
    out.reference_number = p.reference_number ?? undefined;
  }
  if (p.bank_name !== undefined) {
    out.bank_name = p.bank_name ?? undefined;
  }

  // Nota: PaymentInput no incluye received_by/received_at; no los enviamos
  return out;
}
