// src/types/patients.ts
// =====================================================
// REFERENCIA LIGERA DE PACIENTE
// =====================================================
export interface PatientRef {
  id: number;
  full_name: string;          // usar SIEMPRE este campo en UI (viene del backend)
  national_id?: string | null;
  email?: string | null;
}
// =====================================================
// PREDISPOSICIÓN GENÉTICA
// =====================================================
export interface GeneticPredisposition {
  id: number;
  name: string;
  description?: string | null;
}
// =====================================================
// RESUMEN DE CONSULTA ASOCIADA AL PACIENTE
// =====================================================
export interface AppointmentSummary {
  id: number;
  date: string;   // ISO string
  status: "scheduled" | "in_consultation" | "completed" | "canceled";
  doctor_name?: string | null;
}
// =====================================================
// ALERGIA (alineado con backend)
// =====================================================
export interface Allergy {
  id: number;
  name: string;
  severity: "mild" | "moderate" | "severe" | "unknown";
  source?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}
// =====================================================
// ANTECEDENTES MÉDICOS
// =====================================================
export interface MedicalHistory {
  id: number;
  patient: number;
  condition: string;
  status: "active" | "resolved" | "suspected" | "remission" | "permanent";
  status_display?: string;
  source?: string | null;
  notes?: string | null;
  onset_date?: string | null;
  created_at?: string;
  updated_at?: string;
  created_by?: number | null;
}
// =====================================================
// HISTORIAL PERSONAL
// =====================================================
export interface PersonalHistory {
  id: number;
  description: string;
  diagnosis_date?: string | null; // ISO string
}
// =====================================================
// HISTORIAL FAMILIAR
// =====================================================
export interface FamilyHistory {
  id: number;
  relative: string; // ej. "padre", "madre"
  condition: string;
  notes?: string | null;
}
// =====================================================
// CIRUGÍA
// =====================================================
export interface Surgery {
  id: number;
  name: string;
  date?: string | null; // ISO string
  notes?: string | null;
}
// =====================================================
// TIPOS DE HÁBITO
// =====================================================
export type HabitType = "tabaquismo" | "alcohol" | "drogas" | "ejercicio" | "alimentacion";
export type HabitFrequency = "diario" | "ocasional" | "semanal" | "mensual";
export type HabitImpact = "alto" | "medio" | "bajo";
// =====================================================
// HÁBITO (lectura desde backend)
// =====================================================
export interface Habit {
  id: number;
  type: HabitType;
  frequency: HabitFrequency;
  impact?: HabitImpact;
  notes?: string | null;
}
// =====================================================
// HÁBITO (formulario frontend, creación/edición)
// =====================================================
export interface HabitForm {
  type: HabitType | "";
  frequency: HabitFrequency | "";
  impact?: HabitImpact | "";
  notes?: string;
}
// =====================================================
// VACUNACIÓN DEL PACIENTE (registro aplicado)
// =====================================================
export interface PatientVaccination {
  id: number;
  vaccine_name: string;
  date_administered?: string | null; // ISO string
  center?: string | null;
  lot?: string | null;
  notes?: string | null;
}
// =====================================================
// ESQUEMA DE VACUNACIÓN (dosis esperadas y aplicadas)
// =====================================================
export interface VaccineDose {
  id?: number; // opcional, si viene del backend
  vaccine: {
    id: number;
    code: string;
    name: string;
  };
  age?: string; // ej. "2 meses"
  expected?: boolean;
  dose_number: number;
  recommended_age_months?: number;
  date_administered?: string; // ISO string
  center?: string;
  lot?: string;
  applied?: {
    date: string;
    lot: string;
    professional: string;
  };
}
// =====================================================
// ALERTAS CLÍNICAS
// =====================================================
export interface ClinicalAlert {
  id: number;
  patient: number;
  type: "allergy" | "risk" | "warning";
  message: string;
  level?: "low" | "medium" | "high" | "critical";
  is_active: boolean;
}
// =====================================================
// ADDRESS CHAIN (propiedad calculada del backend)
// =====================================================
export interface AddressChain {
  neighborhood: string;
  neighborhood_id: number | null;
  parish: string;
  parish_id: number | null;
  municipality: string;
  municipality_id: number | null;
  state: string;
  state_id: number | null;
  country: string;
  country_id: number | null;
  full_path: string;
}
// =====================================================
// MODELO COMPLETO DE PACIENTE (lectura detallada)
// =====================================================
export interface Patient extends PatientRef {
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  second_last_name?: string | null;
  birthdate?: string | null;   // ISO string
  birth_place?: string | null;
  birth_country?: string | null;
  birth_country_obj?: {        // 🆕 Objeto anidado del backend
    id: number;
    name: string;
  };
  gender: "M" | "F" | "Other" | "Unknown" | null;
  contact_info?: string | null;
  // Ubicación jerárquica
  neighborhood?: {
    id: number;
    name: string;
    parish?: {
      id: number;
      name: string;
      municipality?: {
        id: number;
        name: string;
        state?: {
          id: number;
          name: string;
          country?: {
            id: number;
            name: string;
          };
        };
      };
    };
  };
  // AddressChain (propiedad calculada)
  address_chain?: AddressChain;
  // Perfil clínico base
  weight?: number | string | null;   // DRF puede serializar Decimal como string
  height?: number | string | null;
  blood_type?: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | null;
  allergies?: string | null;
  medical_history?: string | null;
  // Predisposiciones genéticas (objetos completos en lectura)
  genetic_predispositions?: GeneticPredisposition[];
  // Alertas clínicas
  alerts?: ClinicalAlert[];
  // Histórico completo
  personal_history?: PersonalHistory[];
  family_history?: FamilyHistory[];
  surgeries?: Surgery[];
  habits?: Habit[];
  vaccinations?: PatientVaccination[];
  vaccination_schedule?: VaccineDose[];
  // Operativos
  active?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
  // Campos calculados/extendidos desde el backend
  age?: number | null;
}
// =====================================================
// DATOS DE ENTRADA PARA CREAR/EDITAR PACIENTE (escritura)
// =====================================================
export type PatientInput = {
  national_id?: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  second_last_name?: string;
  birthdate?: string | null;
  birth_place?: string;
  birth_country?: string;
  gender?: "M" | "F" | "Other" | "Unknown" | null;
  contact_info?: string;
  email?: string | null;
  phone_number?: string;
  // Ubicación
  address?: string;
  neighborhood_id?: number;
  country_id?: number;
  state_id?: number;
  municipality_id?: number;
  parish_id?: number;
  // Perfil clínico
  weight?: number | string;
  height?: number | string;
  blood_type?: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
  allergies?: string;
  medical_history?: string;
  // Predisposiciones genéticas en input (IDs numéricos)
  genetic_predispositions?: number[];
};
// =====================================================
// PERFIL CLÍNICO COMPLETO (respuesta enriquecida del backend)
// =====================================================
export interface PatientClinicalProfile extends Patient {
  personal_history?: PersonalHistory[];
  family_history?: FamilyHistory[];
  surgeries?: Surgery[];
  habits?: Habit[];
  vaccinations?: PatientVaccination[];
  vaccination_schedule?: VaccineDose[];
}
// =====================================================
// PACIENTE LIGERO (listas, tablas)
// =====================================================
export interface PatientList extends PatientRef {
  id: number;
  full_name: string;
  national_id?: string | null;
  age?: number | null;
  gender?: string;
  phone_number?: string | null;
  short_address?: string;
  active?: boolean;
}