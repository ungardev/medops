// src/utils/appointmentMapper.ts
import type { Appointment, AppointmentStatus } from "../types/appointments";
import type { Patient as PatientAdmin } from "../types/patients";
import type { InstitutionSettings } from "../types/config";
import { IdentityInstitution } from "../types/identity"; // 🆕 IMPORTANTE: Añadir este import
import { mapPatient } from "./patientMapper";
type ClinicalPayment = NonNullable<Appointment["payments"]>[number];
interface PaymentUI extends Omit<ClinicalPayment, "amount"> {
  amount: number;
  currency: string;
  idempotency_key?: string | null;
}
// 🆕 INTERFAZ EXPANDIDA CON DATOS INSTITUCIONALES
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
  
  // 🆕 CAMPOS INSTITUCIONALES ACTUALIZADOS
  institution?: number | null;  // ID de la institución
  institution_name?: string | null; // Nombre de la institución
  // ❌ ELIMINAR: institution_obj?: InstitutionSettings | null; // No necesario, causa más problemas
  
  // 🆕 CAMPOS ADICIONALES QUE PUEDEN SER NULL
  charge_order?: Appointment["charge_order"] | null;  // Puede ser null
  medical_tests?: Appointment["medical_tests"] | null;    // Puede ser null
  referrals?: Appointment["referrals"] | null;          // Puede ser null
  balance_due?: number | null;                           // Puede ser null
  
  // 🆕 CAMPOS DOCTOR
  doctor_obj?: Appointment["doctor"] | null;           // Puede ser null
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
// 🆕 FUNCIÓN UNIFICADA PARA OBTENER NOMBRE DE INSTITUCIÓN
function getInstitutionName(institution?: number | InstitutionSettings | IdentityInstitution | null): string | null {
  if (!institution) return null;
  
  // Si es objeto (cualquier tipo que tenga 'name')
  if (typeof institution === 'object' && institution !== null && 'name' in institution) {
    return institution.name || null;
  }
  
  // Si es solo ID
  if (typeof institution === 'number') {
    return `Institution ${institution}`;
  }
  
  return null;
}
// 🆕 FUNCIÓN CORREGIDA PARA OBTENER INSTITUCIÓN COMO OBJETO
function getInstitutionAsObject(institution?: number | IdentityInstitution | null): InstitutionSettings | null {
  if (!institution) return null;
  
  // Si es objeto IdentityInstitution
  if (typeof institution === 'object' && institution !== null && 'name' in institution) {
    // 🆕 CONVERTIR IdentityInstitution a InstitutionSettings
    const identityInst = institution as IdentityInstitution;
    return {
      id: identityInst.id,
      name: identityInst.name,
      tax_id: identityInst.tax_id,
      phone: identityInst.phone || "",
      address: identityInst.address || "",
      is_active: identityInst.is_active || true,
      logo: identityInst.logo || null,
      
      // 🆕 CAMPOS GEOGRÁFICOS
      neighborhood: identityInst.neighborhood || null,
      country: identityInst.country || null,
      state_name: identityInst.state_name || null,
      municipality_name: identityInst.municipality_name || null,
      parish_name: identityInst.parish_name || null,
      
      // 🆕 CAMPOS FINANCIEROS
      active_gateway: identityInst.active_gateway || 'none',
      is_gateway_test_mode: identityInst.is_gateway_test_mode,
      settlement_bank_name: identityInst.settlement_bank_name || null,
      settlement_account_id: identityInst.settlement_account_id || null,
    };
  }
  
  // Si es solo ID, no podemos obtener el objeto completo
  if (typeof institution === 'number') {
    return {
      id: institution,
      name: `Institution ${institution}`,
      tax_id: 'N/A',
      phone: "",
      address: "",
      is_active: true,
      logo: null,
      
      // Valores por defecto
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
    
    // 🆕 MAPEO CORREGIDO DE CAMPOS INSTITUCIONALES
    institution: clinical.institution?.id ?? null,
    institution_name: getInstitutionName(clinical.institution), // 🆕 Simplificado y corregido
    
    // 🆕 MAPEO DE CAMPOS ADICIONALES QUE PUEDEN SER NULL
    charge_order: clinical.charge_order ?? null,
    medical_tests: clinical.medical_tests ?? null,
    referrals: clinical.referrals ?? null,
    balance_due: clinical.balance_due ?? null,
    
    // 🆕 MAPEO DE CAMPOS DOCTOR
    doctor_obj: clinical.doctor ?? null,
  };
}