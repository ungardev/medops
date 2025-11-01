// src/types/consultation.ts

// --- Diagnóstico ---
export interface Diagnosis {
  id: number;
  code: string;
  description?: string;
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
