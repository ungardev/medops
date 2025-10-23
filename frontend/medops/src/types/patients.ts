// --- Referencia ligera de paciente (para listas, sala de espera, citas, etc.)
export interface PatientRef {
  id: number;
  name: string;
}

// --- Modelo completo de paciente
export interface Patient extends PatientRef {
  age: number;
  diagnosis: string;
  // Aquí puedes agregar más campos en el futuro: documento, contacto, seguro, etc.
}

// --- Datos de entrada para crear/editar paciente
export type PatientInput = {
  first_name: string;
  last_name: string;
  age: number;
  diagnosis: string;
};
