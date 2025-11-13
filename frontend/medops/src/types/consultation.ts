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
  status: "active" | "completed" | "suspended";   // 👈 añadido
  treatment_type: "pharmacological" | "surgical" | "therapeutic" | "other"; // 👈 añadido
}

// --- Prescripción ---
export interface Prescription {
  id: number;
  medication: string;
  dosage?: string;
  duration?: string;
  frequency?: "daily" | "bid" | "tid" | "qid"; // 👈 añadido
  route?: "oral" | "iv" | "im" | "sc";         // 👈 añadido
  unit?: "mg" | "ml" | "g" | "tablet";         // 👈 añadido
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
  currency: string;      // 👈 añadido
  method: string;
  status: string;
  reference_number?: string | null;
  bank_name?: string | null;
  received_by?: string | null;
  received_at?: string | null;
  idempotency_key?: string | null; // 👈 añadido
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
  appointment_date?: string; // 👈 añadido
  arrival_time?: string | null; // 👈 añadido
  status: "pending" | "arrived" | "in_consultation" | "completed" | "canceled"; // 👈 corregido
  notes?: string | null;
  diagnoses: Diagnosis[];
  treatments: Treatment[];
  prescriptions: Prescription[];
  documents?: MedicalDocument[];
  payments?: Payment[];
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
  urgency: "routine" | "urgent" | "stat";   // 👈 añadido
  status: "pending" | "completed" | "cancelled"; // 👈 ya estaba, pero lo confirmamos
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
  code: string;   // ej: "cardiology"
  name: string;   // ej: "Cardiología"
}

// --- Referencia médica ---
export interface MedicalReferral {
  id: number;
  appointment: number;
  diagnosis?: number | null;
  issued_by?: number | null;
  referred_to: string;
  reason?: string;

  // 🔹 Nuevo modelo institucional
  specialties: Specialty[];     // lectura: array de objetos completos
  specialty_ids?: number[];     // escritura: array de IDs

  urgency: "routine" | "urgent" | "stat";
  status: "issued" | "accepted" | "rejected";

  issued_at: string;
  created_at: string;
  updated_at: string;
  created_by?: number | null;
  updated_by?: number | null;
}
