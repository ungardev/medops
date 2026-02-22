// src/utils/appointmentMapper.ts
import type { Appointment, AppointmentStatus } from "../types/appointments";
import type { Patient as PatientAdmin } from "../types/patients";
import type { InstitutionSettings } from "../types/config";
import { IdentityInstitution } from "../types/identity";
import { mapPatient } from "./patientMapper";
type ClinicalPayment = NonNullable<Appointment["payments"]>[number];
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
  started_at: string | null;
  created_at: string;
  updated_at: string;
  patient: PatientAdmin;
  notes: string | null;
  diagnoses: Appointment["diagnoses"];
  treatments: Appointment["treatments"];
  prescriptions: Appointment["prescriptions"];
  documents: Appointment["documents"];
  payments: PaymentUI[];
  
  institution?: number | null;
  institution_name?: string | null;
  
  charge_order?: Appointment["charge_order"] | null;
  medical_tests?: Appointment["medical_tests"] | null;
  referrals?: Appointment["referrals"] | null;
  balance_due?: number | null;
  documents_count?: number;  // ← NUEVO
  
  doctor_obj?: Appointment["doctor"] | null;
}
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
      return status as AppointmentStatus;
    default:
      return "pending";
  }
}
function getInstitutionName(institution?: number | InstitutionSettings | IdentityInstitution | null): string | null {
  if (!institution) return null;
  
  if (typeof institution === 'object' && institution !== null && 'name' in institution) {
    return institution.name || null;
  }
  
  if (typeof institution === 'number') {
    return `Institution ${institution}`;
  }
  
  return null;
}
function getInstitutionAsObject(institution?: number | IdentityInstitution | null): InstitutionSettings | null {
  if (!institution) return null;
  
  if (typeof institution === 'object' && institution !== null && 'name' in institution) {
    const identityInst = institution as IdentityInstitution;
    return {
      id: identityInst.id,
      name: identityInst.name,
      tax_id: identityInst.tax_id,
      phone: identityInst.phone || "",
      address: identityInst.address || "",
      is_active: identityInst.is_active || true,
      logo: identityInst.logo || null,
      neighborhood: identityInst.neighborhood || null,
      country: identityInst.country || null,
      state_name: identityInst.state_name || null,
      municipality_name: identityInst.municipality_name || null,
      parish_name: identityInst.parish_name || null,
      active_gateway: identityInst.active_gateway || 'none',
      is_gateway_test_mode: identityInst.is_gateway_test_mode,
      settlement_bank_name: identityInst.settlement_bank_name || null,
      settlement_account_id: identityInst.settlement_account_id || null,
    };
  }
  
  if (typeof institution === 'number') {
    return {
      id: institution,
      name: `Institution ${institution}`,
      tax_id: 'N/A',
      phone: "",
      address: "",
      is_active: true,
      logo: null,
      neighborhood: null,
      country: null,
      state_name: null,
      municipality_name: null,
      parish_name: null,
      active_gateway: 'none',
      is_gateway_test_mode: false,
      settlement_bank_name: null,
      settlement_account_id: null,
    };
  }
  
  return null;
}
export function mapAppointment(clinical: Appointment): AppointmentUI {
  return {
    id: clinical.id,
    status: normalizeStatus(clinical.status),
    appointment_date: clinical.appointment_date ?? undefined,
    arrival_time: clinical.arrival_time ?? null,
    started_at: clinical.started_at ?? null,
    created_at: clinical.created_at ?? "",
    updated_at: clinical.updated_at ?? "",
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
    
    institution: clinical.institution?.id ?? null,
    institution_name: getInstitutionName(clinical.institution),
    
    charge_order: clinical.charge_order ?? null,
    medical_tests: clinical.medical_tests ?? null,
    referrals: clinical.referrals ?? null,
    balance_due: clinical.balance_due ?? null,
    documents_count: clinical.documents_count ?? 0,  // ← NUEVO
    
    doctor_obj: clinical.doctor ?? null,
  };
}