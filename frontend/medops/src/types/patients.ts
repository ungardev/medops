// --- Referencia ligera de paciente (para listas, sala de espera, etc.)
export interface PatientRef {
  id: number;
  full_name: string;          // 👈 usar SIEMPRE este campo en UI (viene del backend)
  national_id?: string | null;
  email?: string | null;
}

// --- Modelo de predisposición genética
export interface GeneticPredisposition {
  id: number;
  name: string;
  description?: string | null;
}

// --- Resumen de consulta asociada al paciente
export interface AppointmentSummary {
  id: number;
  date: string;   // ISO string
  status: "scheduled" | "in_consultation" | "completed" | "canceled";
  doctor_name?: string | null;
}

// --- Historial personal
export interface PersonalHistory {
  id: number;
  description: string;
  diagnosis_date?: string | null; // ISO string
}

// --- Historial familiar
export interface FamilyHistory {
  id: number;
  relative: string; // ej. "padre", "madre"
  condition: string;
  notes?: string | null;
}

// --- Cirugía
export interface Surgery {
  id: number;
  name: string;
  date?: string | null; // ISO string
  notes?: string | null;
}

// --- Tipos institucionales para hábitos
export type HabitType =
  | "tabaquismo"
  | "alcohol"
  | "drogas"
  | "ejercicio"
  | "alimentacion";

export type HabitFrequency = "diario" | "ocasional" | "semanal" | "mensual";
export type HabitImpact = "alto" | "medio" | "bajo";

// --- Hábito (lectura desde backend)
export interface Habit {
  id: number;
  type: HabitType;
  frequency: HabitFrequency;
  impact?: HabitImpact;
  notes?: string | null;
}

// --- Hábito (formulario frontend, creación/edición)
export interface HabitForm {
  type: HabitType | "";
  frequency: HabitFrequency | "";
  impact?: HabitImpact | "";
  notes?: string;
}

// --- Vacunación del paciente (registro aplicado)
export interface PatientVaccination {
  id: number;
  vaccine_name: string;
  date_administered?: string | null; // ISO string
  center?: string | null;
  lot?: string | null;
  notes?: string | null;
}

// --- Esquema de vacunación (dosis esperadas y aplicadas)
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

// --- Modelo completo de paciente (lectura detallada)
export interface Patient extends PatientRef {
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  second_last_name?: string | null;

  birthdate?: string | null;   // ISO string
  gender: "M" | "F" | "Unknown" | null;
  contact_info?: string | null;

  // 🔹 Campos adicionales del modelo
  address?: string | null;
  weight?: number | string | null;   // DRF puede serializar Decimal como string
  height?: number | string | null;
  blood_type?: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | null;
  allergies?: string | null;
  medical_history?: string | null;

  // 🔹 NUEVOS CAMPOS DEMOGRÁFICOS
  birth_place?: string | null;
  birth_country?: string | null;

  // 🔹 Predisposiciones genéticas (objetos completos en lectura)
  genetic_predispositions?: GeneticPredisposition[];

  // 🔹 Consultas asociadas al paciente (resumen)
  consultations?: AppointmentSummary[];

  // Operativos
  active?: boolean;
  created_at?: string | null;
  updated_at?: string | null;

  // 🔹 Campos calculados/extendidos desde el backend
  age?: number | null;

  // 🔹 Dirección completa
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

  // ⚡ address_chain extendido con IDs
  address_chain?: {
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
  };
}

// --- Datos de entrada para crear/editar paciente (escritura)
export type PatientInput = {
  national_id?: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  second_last_name?: string;

  birthdate?: string | null;
  gender?: "M" | "F" | "Unknown" | null;
  contact_info?: string;
  email?: string | null;

  // 🔹 NUEVOS CAMPOS DEMOGRÁFICOS
  birth_place?: string;
  birth_country?: string;

  // 🔹 Campos opcionales en creación/edición
  address?: string;
  weight?: number | string;
  height?: number | string;
  blood_type?: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
  allergies?: string;
  medical_history?: string;

  // 🔹 Predisposiciones genéticas en input (IDs numéricos)
  genetic_predispositions?: number[];

  // 🔹 Campos de dirección en input
  neighborhood_id?: number;
  country_id?: number;
  state_id?: number;
  municipality_id?: number;
  parish_id?: number;
};

// --- Perfil clínico completo (respuesta enriquecida del backend)
export interface PatientClinicalProfile extends Patient {
  personal_history?: PersonalHistory[];
  family_history?: FamilyHistory[];
  surgeries?: Surgery[];
  habits?: Habit[];
  vaccinations?: PatientVaccination[];
  vaccination_schedule?: VaccineDose[]; // 🔹 Esquema completo esperado/aplicado
}
