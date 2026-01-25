// src/types/clinical.ts
// =====================================================
// IMPORTAR TIPOS DESDE identity.ts
// =====================================================
import type { IdentityPatient, IdentityDoctor, IdentityInstitution } from "./identity";
// =====================================================
// VITAL SIGNS - Signos Vitales del Paciente
// =====================================================
export interface VitalSigns {
  id?: number;
  appointment: number;
  
  // Mediciones biométricas
  weight?: number;        // kg
  height?: number;        // cm
  temperature?: number;   // °C
  bp_systolic?: number;   // mmHg
  bp_diastolic?: number;  // mmHg
  heart_rate?: number;     // bpm
  respiratory_rate?: number; // respiraciones/min
  oxygen_saturation?: number; // %
  
  // Campo calculado
  bmi?: number;           // Calculado automáticamente
  
  // Auditoría
  created_at?: string;
  updated_at?: string;
  created_by?: number | null;
  updated_by?: number | null;
}
// =====================================================
// CLINICAL NOTE - Formato SOAP completo
// =====================================================
export interface ClinicalNote {
  id?: number;
  appointment: number;
  
  // Estructura SOAP
  subjective: string;      // Subjetivo: síntomas del paciente
  objective: string;       // Objetivo: hallazgos medibles
  analysis: string;        // Análisis: interpretación clínica
  plan: string;           // Plan: tratamiento y seguimiento
  
  // Control de integridad
  is_locked: boolean;
  locked_at?: string;
  locked_by?: number | null;
  
  // Auditoría
  created_at?: string;
  updated_at?: string;
  created_by?: number | null;
  updated_by?: number | null;
}
// =====================================================
// INPUTS PARA VITAL SIGNS
// =====================================================
export interface CreateVitalSignsInput {
  appointment: number;
  weight?: number;
  height?: number;
  temperature?: number;
  bp_systolic?: number;
  bp_diastolic?: number;
  heart_rate?: number;
  respiratory_rate?: number;
  oxygen_saturation?: number;
}
export interface UpdateVitalSignsInput {
  weight?: number;
  height?: number;
  temperature?: number;
  bp_systolic?: number;
  bp_diastolic?: number;
  heart_rate?: number;
  respiratory_rate?: number;
  oxygen_saturation?: number;
}
// =====================================================
// INPUTS PARA CLINICAL NOTE
// =====================================================
export interface CreateClinicalNoteInput {
  appointment: number;
  subjective: string;
  objective: string;
  analysis: string;
  plan: string;
}
export interface UpdateClinicalNoteInput {
  subjective?: string;
  objective?: string;
  analysis?: string;
  plan?: string;
  is_locked?: boolean;
}
