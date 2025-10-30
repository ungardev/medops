// --- Referencia ligera de paciente (para listas, sala de espera, etc.)
export interface PatientRef {
  id: number;
  full_name: string;          // 👈 usar SIEMPRE este campo en UI (viene del backend)
  national_id?: string | null;
  email?: string | null;
}

// --- Modelo completo de paciente
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

  // 🔹 Nuevo campo: predisposiciones genéticas
  genetic_predispositions?: string[];   // 👈 array de strings

  // Operativos
  active?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

// --- Datos de entrada para crear/editar paciente
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

  // 🔹 Campos opcionales en creación/edición
  address?: string;
  weight?: number | string;
  height?: number | string;
  blood_type?: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
  allergies?: string;
  medical_history?: string;

  // 🔹 Nuevo campo en input
  genetic_predispositions?: string[];
};
