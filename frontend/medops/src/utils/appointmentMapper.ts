import type { Appointment as ClinicalAppointment } from "../types/consultation";
import type { Patient as PatientAdmin } from "../types/patients";
import { mapPatient } from "./patientMapper";

type ClinicalPayment = NonNullable<ClinicalAppointment["payments"]>[number];

interface PaymentUI extends Omit<ClinicalPayment, "amount"> {
  amount: number;
}

export interface AppointmentUI
  extends Omit<
    ClinicalAppointment,
    | "patient"
    | "notes"
    | "diagnoses"
    | "treatments"
    | "prescriptions"
    | "documents"
    | "payments"
  > {
  patient: PatientAdmin;
  notes: string | null;
  diagnoses: ClinicalAppointment["diagnoses"];
  treatments: ClinicalAppointment["treatments"];
  prescriptions: ClinicalAppointment["prescriptions"];
  documents: ClinicalAppointment["documents"];
  payments: PaymentUI[];
}

export function mapAppointment(clinical: ClinicalAppointment): AppointmentUI {
  return {
    id: clinical.id,
    status: clinical.status,
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
