import type { Patient as PatientAdmin } from "../types/patients";
export interface ClinicalPatient {
  id: number;
  full_name?: string;
  birth_date?: string | null;
  gender?: string | null;
  national_id?: string | null;
  allergies?: string | null;
  age?: number | null;
}
export function splitFullName(full_name?: string | null): { first_name: string; last_name: string } {
  const trimmed = full_name?.trim() ?? "";
  const parts = trimmed.split(/\s+/);
  if (parts.length === 0) {
    return { first_name: "", last_name: "" };
  }
  return {
    first_name: parts[0] || "",
    last_name: parts.slice(1).join(" ") || "",
  };
}
function normalizeGender(gender: string | null | undefined): "M" | "F" | "Other" | "Unknown" | null {
  if (!gender) return null;
  const g = gender.toUpperCase();
  if (g === "M" || g === "F") return g;
  if (g === "OTHER") return "Other";
  return "Unknown";
}
export function mapPatient(clinical: ClinicalPatient): PatientAdmin {
  const nameParts = splitFullName(clinical.full_name);
  return {
    id: clinical.id,
    full_name: clinical.full_name ?? "",
    first_name: nameParts.first_name,
    last_name: nameParts.last_name,
    birthdate: clinical.birth_date ?? null,
    gender: normalizeGender(clinical.gender),
    age: clinical.age ?? null,
    allergies: clinical.allergies ?? null,
    national_id: clinical.national_id ?? "N/A",
    middle_name: null,
    second_last_name: null,
    contact_info: null,
    weight: null,
    height: null,
    blood_type: null,
    medical_history: null,
    genetic_predispositions: [],
    active: true,
    created_at: null,
    updated_at: null,
    email: null,
  };
}