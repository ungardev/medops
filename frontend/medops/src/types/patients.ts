// --- Referencia ligera de paciente (para listas, sala de espera, etc.)
export interface PatientRef {
  id: number;
  full_name: string;          // 👈 viene del backend (PatientReadSerializer)
  national_id?: string | null;
  email?: string | null;      // 👈 nuevo campo
}

// --- Modelo completo de paciente
export interface Patient extends PatientRef {
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  second_last_name?: string | null;
  birthdate?: string | null;   // ISO string
  gender: "M" | "F" | "Unknown";
  contact_info?: string | null;
}

// --- Datos de entrada para crear/editar paciente
export type PatientInput = {
  national_id?: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  second_last_name?: string;
  birthdate?: string;
  gender?: "M" | "F" | "Unknown";
  contact_info?: string;
  email?: string;              // 👈 nuevo campo
};
