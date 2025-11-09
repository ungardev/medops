import type { Appointment as ClinicalAppointment } from "../types/consultation";
import type { Patient as PatientAdmin } from "../types/patients";
import { mapPatient } from "./patientMapper";
import type { AppointmentStatus } from "../types/appointments"; // 👈 usar el oficial

type ClinicalPayment = NonNullable<ClinicalAppointment["payments"]>[number];

interface PaymentUI extends Omit<ClinicalPayment, "amount"> {
  amount: number;
}

export interface AppointmentUI {
  id: number;
  status: AppointmentStatus; // 👈 ahora blindado
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

// 🔹 Normalización defensiva de estados legacy
function normalizeStatus(status: string): AppointmentStatus {
  switch (status) {
    case "in_progress":
      return "in_consultation";
    case "scheduled":
      return "pending";
    default:
      return status as AppointmentStatus;
  }
}

export function mapAppointment(clinical: ClinicalAppointment): AppointmentUI {
  return {
    id: clinical.id,
    status: normalizeStatus(clinical.status), // 👈 normalizado
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
    })),
  };
}
