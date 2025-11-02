import type { Patient as PatientAdmin } from "../types/patients";

// Este tipo representa el Patient que viene en Appointment (consultation.ts)
export interface ClinicalPatient {
  id: number;
  first_name: string;
  last_name: string;
  birth_date?: string | null;
  gender?: string | null;
  full_name?: string;
  national_id?: string | null;
  allergies?: string | null;
  age?: number | null;   // 👈 ahora lo aceptamos porque el backend lo manda
}

/**
 * Mapea un Patient clínico (Appointment) al Patient administrativo esperado en UI.
 */
export function mapPatient(clinical: ClinicalPatient): PatientAdmin {
  // Normalizamos gender a los literales permitidos
  let gender: "M" | "F" | "Unknown" | null = "Unknown";
  if (clinical.gender === "M" || clinical.gender === "F") {
    gender = clinical.gender;
  } else if (clinical.gender === null) {
    gender = null;
  }

  return {
    id: clinical.id,
    full_name: clinical.full_name ?? `${clinical.first_name} ${clinical.last_name}`,
    first_name: clinical.first_name,
    last_name: clinical.last_name,
    birthdate: clinical.birth_date ?? null,
    gender,

    // 🔹 ahora sí pasamos la edad
    age: clinical.age ?? null,

    // Campos del modelo administrativo
    middle_name: null,
    second_last_name: null,
    contact_info: null,
    address: null,
    weight: null,
    height: null,
    blood_type: null,
    allergies: clinical.allergies ?? null,
    medical_history: null,
    genetic_predispositions: [],
    active: true,
    created_at: null,
    updated_at: null,
    email: null,
    national_id: clinical.national_id ?? "N/A",
  };
}
