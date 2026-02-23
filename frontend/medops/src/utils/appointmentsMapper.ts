import type { Appointment } from "../types/appointments";
import type { AppointmentStatus } from "../types/appointments";
import type { IdentityPatient, IdentityDoctor, IdentityInstitution } from "../types/identity";
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
      return "pending";
  }
}
function normalizePatient(raw: any): IdentityPatient {
  if (raw.patient && typeof raw.patient === "object" && raw.patient.full_name) {
    return {
      id: raw.patient.id || 0,
      national_id: raw.patient.national_id || null,
      full_name: raw.patient.full_name,
      gender: raw.patient.gender || "Unknown",
    };
  }
  
  if (raw.patient && typeof raw.patient === "number") {
    return {
      id: raw.patient,
      national_id: raw.patient_national_id || null,
      full_name: raw.patient_name || "UNKNOWN_SUBJECT",
      gender: raw.patient_gender || "Unknown",
    };
  }
  
  if (raw.patient_name) {
    return {
      id: raw.patient || 0,
      national_id: raw.patient_national_id || null,
      full_name: raw.patient_name,
      gender: raw.patient_gender || "Unknown",
    };
  }
  
  return { id: 0, national_id: null, full_name: "UNKNOWN_SUBJECT", gender: "Unknown" };
}
function normalizeDoctor(raw: any): IdentityDoctor {
  if (raw.doctor && typeof raw.doctor === "object" && raw.doctor.full_name) {
    return {
      id: raw.doctor.id || 0,
      full_name: raw.doctor.full_name,
      colegiado_id: raw.doctor.colegiado_id || null,
      gender: raw.doctor.gender || "Unknown",
      is_verified: raw.doctor.is_verified || false,
    };
  }
  
  return {
    id: typeof raw.doctor === "number" ? raw.doctor : 0,
    full_name: raw.doctor_name || "UNKNOWN_DOCTOR",
    colegiado_id: null,
    gender: "Unknown",
    is_verified: false,
  };
}
function normalizeInstitution(raw: any): IdentityInstitution {
  if (raw.institution && typeof raw.institution === "object" && raw.institution.name) {
    return {
      id: raw.institution.id || 0,
      name: raw.institution.name,
      tax_id: raw.institution.tax_id || "N/A",
      is_active: raw.institution.is_active ?? true,
      active_gateway: raw.institution.active_gateway || "none",
      is_gateway_test_mode: raw.institution.is_gateway_test_mode ?? false,
    };
  }
  
  return {
    id: typeof raw.institution === "number" ? raw.institution : 0,
    name: raw.institution_name || "UNKNOWN_INSTITUTION",
    tax_id: "N/A",
    is_active: true,
    active_gateway: "none",
    is_gateway_test_mode: false,
  };
}
export function mapAppointmentList(raw: any): Appointment {
  const co = raw?.charge_order ?? undefined;
  const items = Array.isArray(co?.items) ? co.items : [];
  const payments = Array.isArray(co?.payments) ? co.payments : [];
  
  return {
    id: raw.id,
    patient: normalizePatient(raw),
    appointment_date: raw.appointment_date?.slice(0, 10) ?? "",
    appointment_type: raw.appointment_type ?? "general",
    institution: normalizeInstitution(raw),
    doctor: normalizeDoctor(raw),
    expected_amount:
      typeof raw.expected_amount === "number"
        ? raw.expected_amount
        : String(raw.expected_amount ?? ""),
    status: normalizeStatus(raw.status),
    arrival_time: raw.arrival_time ?? null,
    notes: raw.notes ?? "",
    diagnoses: Array.isArray(raw.diagnoses) ? raw.diagnoses : [],
    treatments: Array.isArray(raw.treatments) ? raw.treatments : [],
    prescriptions: Array.isArray(raw.prescriptions) ? raw.prescriptions : [],
    documents: Array.isArray(raw.documents) ? raw.documents : [],
    payments: Array.isArray(raw.payments) ? raw.payments : [],
    charge_order: co
      ? {
          ...co,
          total: Number(co?.total ?? 0),
          balance_due: Number(co?.balance_due ?? 0),
          items,
          payments,
        }
      : undefined,
    balance_due: Number(raw.balance_due ?? 0),
    created_at: raw.created_at ?? "",
    updated_at: raw.updated_at ?? "",
  };
}