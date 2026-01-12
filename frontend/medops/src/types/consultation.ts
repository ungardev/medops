import type { ChargeOrder } from "./payments";

// --- Diagnóstico ---
export interface Diagnosis {
  id: number;

  // 🔹 Metadatos ICD-11
  icd_code: string;        // código ICD-11 oficial (ej: "CA23.0")
  title?: string;          // descripción oficial OMS
  foundation_id?: string;  // ID único ICD-11
  description?: string;    // notas adicionales del médico

  // 🔹 Campos clínicos prácticos (lo que devuelve el backend en consultas)
  name?: string;           // nombre del diagnóstico (ej: "Diabetes tipo 2")
  severity?: string;       // severidad clínica (ej: "moderada", "grave")
  source?: string;         // origen del diagnóstico (ej: "anamnesis", "laboratorio")
  notes?: string;          // notas adicionales

  // 🔹 Relaciones
  treatments: Treatment[];
  prescriptions: Prescription[];

  // 🔹 Metadatos
  created_at?: string;
  updated_at?: string;
}

// --- Tratamiento ---
export interface Treatment {
  id: number;
  plan: string;
  start_date?: string;
  end_date?: string;
  status: "active" | "completed" | "cancelled";   // 👈 igual que backend
  treatment_type: "pharmacological" | "surgical" | "rehabilitation" | "lifestyle" | "other"; // 👈 igual que backend
}

// --- Inputs para mutaciones de tratamientos ---
export interface CreateTreatmentInput {
  appointment: number;
  diagnosis: number;
  plan: string;
  start_date?: string;
  end_date?: string;
  status?: "active" | "completed" | "cancelled";
  treatment_type?: "pharmacological" | "surgical" | "rehabilitation" | "lifestyle" | "other";
}

export interface UpdateTreatmentInput {
  id: number;
  plan?: string;
  start_date?: string;
  end_date?: string;
  status?: "active" | "completed" | "cancelled";
  treatment_type?: "pharmacological" | "surgical" | "rehabilitation" | "lifestyle" | "other";
}

// --- Componente de prescripción ---
export interface PrescriptionComponent {
  id?: number;
  substance: string;
  dosage: number;
  unit:
    | "mg" | "ml" | "g"
    | "tablet" | "capsule" | "drop"
    | "puff" | "unit" | "patch";
}

// --- Prescripción ---
export interface Prescription {
  id: number;

  // 🔹 Híbrido: catálogo o texto libre
  medication_catalog?: {
    id: number;
    name: string;
    presentation: string;
    concentration: string;
    route: string;
    unit: string;
  } | null;
  medication_text?: string | null;

  duration?: string | null;
  frequency?:
    | "once_daily" | "bid" | "tid" | "qid"
    | "q4h" | "q6h" | "q8h" | "q12h" | "q24h"
    | "qod" | "stat" | "prn" | "hs"
    | "ac" | "pc" | "achs";
  route?:
    | "oral" | "iv" | "im" | "sc"
    | "topical" | "sublingual" | "inhalation"
    | "rectal" | "other";

  components: PrescriptionComponent[];
}

// --- Inputs para mutaciones de prescripciones ---
export interface CreatePrescriptionInput {
  diagnosis: number;
  medication_catalog?: number;
  medication_text?: string | null;
  duration?: string;
  frequency?: Prescription["frequency"];
  route?: Prescription["route"];
  components: PrescriptionComponent[];
}

export interface UpdatePrescriptionInput {
  id: number;
  medication_catalog?: number;
  medication_text?: string | null;
  duration?: string;
  frequency?: Prescription["frequency"];
  route?: Prescription["route"];
  components?: PrescriptionComponent[];
}

// --- Documento clínico ---
export interface MedicalDocument {
  id: number;
  description?: string;
  category?: string;
  uploaded_at: string;
  uploaded_by?: string;
  file: string;
}

// --- Pago ---
export interface Payment {
  id: number;
  amount: number;
  currency: string;
  method: string;
  status: string;
  reference_number?: string | null;
  bank_name?: string | null;
  received_by?: string | null;
  received_at?: string | null;
  idempotency_key?: string | null;
}

// --- Paciente mínimo ---
export interface Patient {
  id: number;
  first_name: string;
  last_name: string;
  birth_date?: string;
  gender?: string;
}

// --- Consulta / Appointment ---
export interface Appointment {
  id: number;
  patient: Patient;
  appointment_date?: string;
  arrival_time?: string | null;
  // ⚡️ NUEVO CAMPO: Sincronizado con la base de datos para cronómetro
  started_at: string | null; 
  status: "pending" | "arrived" | "in_consultation" | "completed" | "canceled";
  notes?: string | null;
  diagnoses: Diagnosis[];
  treatments: Treatment[];
  prescriptions: Prescription[];
  documents?: MedicalDocument[];
  payments?: Payment[];
  charge_order?: ChargeOrder;
  created_at: string;
  updated_at: string;
}

// --- Examen médico ---
export interface MedicalTest {
  id: number;
  appointment: number;
  diagnosis?: number | null;
  requested_by?: number | null;
  test_type: string;
  test_type_display?: string;
  description?: string;
  urgency: "routine" | "urgent" | "stat";
  status: "pending" | "completed" | "cancelled";
  requested_at: string;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
  created_by?: number | null;
  updated_by?: number | null;
}

// --- Especialidad institucional ---
export interface Specialty {
  id: number;
  code: string;
  name: string;
}

// --- Referencia médica ---
export interface MedicalReferral {
  id: number;
  appointment: number;
  diagnosis?: number | null;
  issued_by?: number | null;
  referred_to: string;
  reason?: string;
  specialties: Specialty[];
  specialty_ids?: number[];
  urgency: "routine" | "urgent" | "stat";
  status: "issued" | "accepted" | "rejected";
  issued_at: string;
  created_at: string;
  updated_at: string;
  created_by?: number | null;
  updated_by?: number | null;
}
