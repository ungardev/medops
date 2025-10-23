// --- Referencia ligera de paciente (para listas, sala de espera, citas, etc.)
export interface PatientRef {
  id: number;
  name: string;
}

// --- Modelo completo de paciente
export interface Patient extends PatientRef {
  age: number;
  diagnosis: string;

  // Campos adicionales que devuelve el backend
  full_name?: string;       // Nombre completo calculado
  birthdate?: string;       // Fecha de nacimiento (ISO string)
  gender?: string;          // "M", "F", "O" u otro
  contact_info?: string;    // Teléfono, email, etc.
}

// --- Datos de entrada para crear/editar paciente
export type PatientInput = {
  first_name: string;
  last_name: string;
  age: number;
  diagnosis: string;
  // En el futuro puedes añadir: documento, contacto, seguro, etc.
};
