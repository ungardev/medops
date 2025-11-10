// src/utils/appointmentsMapper.ts
import type { Appointment } from "../types/appointments";
import type { AppointmentStatus } from "../types/appointments";

// 🔹 Normalización defensiva de estados
function normalizeStatus(status: string | null | undefined): AppointmentStatus {
  switch (status) {
    case "scheduled":
      return "pending";
    case "in_progress":
      return "in_consultation";
    case "pending":
    case "arrived":
    case "in_consultation":
    case "completed":
    case "canceled":
      return status;
    default:
      return "pending"; // fallback seguro
  }
}

export function mapAppointmentList(raw: any): Appointment {
  return {
    id: raw.id,
    patient: raw.patient,
    appointment_date: raw.appointment_date,
    appointment_type: raw.appointment_type,
    expected_amount:
      typeof raw.expected_amount === "number"
        ? raw.expected_amount
        : Number(raw.expected_amount) || 0,
    status: normalizeStatus(raw.status),
    arrival_time: raw.arrival_time ?? null,
    notes: raw.notes ?? null,
    diagnoses: raw.diagnoses ?? [],
    treatments: raw.treatments ?? [],
    prescriptions: raw.prescriptions ?? [],
    documents: raw.documents ?? [],
    payments: raw.payments ?? [],
    created_at: raw.created_at ?? "",
    updated_at: raw.updated_at ?? "",
  };
}
