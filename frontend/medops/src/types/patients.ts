// --- Referencia ligera de paciente (para listas, sala de espera, etc.)
export interface PatientRef {
  id: number;
  full_name: string;          // 👈 viene del backend (PatientReadSerializer)
  national_id?: string | null;
  email?: string | null;      // 👈 puede ser null
}

// --- Modelo completo de paciente
export interface Patient extends PatientRef {
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  second_last_name?: string | null;
  birthdate?: string | null;   // ISO string, puede ser null
  gender: "M" | "F" | "Unknown" | null;  // 👈 puede ser null
  contact_info?: string | null;
}

// --- Datos de entrada para crear/editar paciente
export type PatientInput = {
  national_id?: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  second_last_name?: string;
  birthdate?: string | null;   // 👈 puede ser null
  gender?: "M" | "F" | "Unknown" | null; // 👈 puede ser null
  contact_info?: string;
  email?: string | null;       // 👈 ahora acepta null
};
