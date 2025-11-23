import type { Appointment as ClinicalAppointment } from "../types/consultation";
import type { Patient as PatientAdmin } from "../types/patients";
import { mapPatient } from "./patientMapper";
import type { AppointmentStatus } from "../types/appointments";

type ClinicalPayment = NonNullable<ClinicalAppointment["payments"]>[number];

interface PaymentUI extends Omit<ClinicalPayment, "amount"> {
  amount: number;
  currency: string;
  idempotency_key?: string | null;
}

export interface AppointmentUI {
  id: number;
  status: AppointmentStatus;
  appointment_date?: string;
  arrival_time?: string | null;
  created_at: string;
  updated_at: string;

  patient: PatientAdmin;
  notes: string | null;
  diagnoses: ClinicalAppointment["diagnoses"];
  treatments: ClinicalAppointment["treatments"];
  prescriptions: ClinicalAppointment["prescriptions"];
  documents: ClinicalAppointment["documents"];
  payments: PaymentUI[];
}

// 🔹 Exportado para uso externo
export function normalizeStatus(status: string | null | undefined): AppointmentStatus {
  switch (status) {
    case "in_progress":
      return "in_consultation";
    case "scheduled":
      return "pending";
    case "pending":
    case "arrived":
    case "in_consultation":
    case "completed":
    case "canceled":
      return status;
    default:
      return "pending";
  }
}

export function mapAppointment(clinical: ClinicalAppointment): AppointmentUI {
  return {
    id: clinical.id,
    status: normalizeStatus(clinical.status),
    appointment_date: clinical.appointment_date ?? undefined,
    arrival_time: clinical.arrival_time ?? null,
    created_at: clinical.created_at,
    updated_at: clinical.updated_at,

    patient: mapPatient(clinical.patient),
    notes: clinical.notes ?? null,
    diagnoses: clinical.diagnoses ?? [],
    treatments: clinical.treatments ?? [],
    prescriptions: clinical.prescriptions ?? [],
    documents: clinical.documents ?? [],
    payments: (clinical.payments ?? []).map((p) => ({
      ...p,
      amount: typeof p.amount === "number" ? p.amount : Number(p.amount) || 0,
      currency: p.currency,
      idempotency_key: p.idempotency_key ?? null,
    })),
  };
}
