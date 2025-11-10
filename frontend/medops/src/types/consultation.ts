// src/types/consultation.ts

// --- Diagnóstico ---
export interface Diagnosis {
  id: number;
  icd_code: string;        // código ICD-11 oficial (ej: "CA23.0")
  title?: string;          // descripción oficial OMS
  foundation_id?: string;  // ID único ICD-11
  description?: string;    // notas adicionales del médico
  treatments: Treatment[];
  prescriptions: Prescription[];
}

// --- Tratamiento ---
export interface Treatment {
  id: number;
  plan: string;
  start_date?: string; // ISO date
  end_date?: string;   // ISO date
}

// --- Prescripción ---
export interface Prescription {
  id: number;
  medication: string;
  dosage?: string;
  duration?: string;
}

// --- Documento clínico ---
export interface MedicalDocument {
  id: number;
  description?: string;
  category?: string;     // Ej: "Laboratorio", "Imagenología"
  uploaded_at: string;   // ISO timestamp
  uploaded_by?: string;
  file: string;          // URL del archivo
}

// --- Pago ---
export interface Payment {
  id: number;
  amount: number;
  method: string;
  status: string;
  reference_number?: string | null;
  bank_name?: string | null;
  received_by?: string | null;
  received_at?: string | null;
}

// --- Paciente (mínimo para cockpit) ---
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
  status: "scheduled" | "in_progress" | "completed" | "canceled";
  notes?: string | null;
  diagnoses: Diagnosis[];
  treatments: Treatment[];
  prescriptions: Prescription[];
  documents?: MedicalDocument[];
  payments?: Payment[];
  created_at: string;
  updated_at: string;
}
