// src/utils/patientTransform.ts
import type { Patient as PatientsPatient, AddressChain } from "../types/patients";
// 🔹 Calcular edad desde birthdate
export function calcAge(birthdate?: string | null): number | null {
  if (!birthdate) return null;
  const d = new Date(birthdate);
  if (Number.isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}
// 🔹 Normalizar alergias
export function normalizeAllergies(allergies: any): string {
  if (Array.isArray(allergies)) {
    return allergies
      .map((a: any) => (typeof a === "string" ? a : a?.name ?? ""))
      .filter(Boolean)
      .join(", ");
  }
  if (typeof allergies === "object" && allergies !== null) {
    return allergies.name ?? "";
  }
  return String(allergies ?? "");
}
// 🔹 Normalizar historia médica
export function normalizeMedicalHistory(medical_history: any): string {
  if (Array.isArray(medical_history)) {
    return medical_history
      .map((m: any) =>
        typeof m === "string"
          ? m
          : m?.condition ?? m?.name ?? m?.title ?? ""
      )
      .filter(Boolean)
      .join(", ");
  }
  if (typeof medical_history === "object" && medical_history !== null) {
    return medical_history.condition ?? medical_history.name ?? medical_history.title ?? "";
  }
  return String(medical_history ?? "");
}
const EMPTY_CHAIN: AddressChain = {
  country: "",
  country_id: null,
  state: "",
  state_id: null,
  municipality: "",
  municipality_id: null,
  parish: "",
  parish_id: null,
  neighborhood: "",
  neighborhood_id: null,
  full_path: "",
};
// 🔹 Normalizar address_chain
export function normalizeAddressChain(chain: any): AddressChain {
  if (!chain || typeof chain !== "object") return EMPTY_CHAIN;
  return {
    country: String(chain.country ?? ""),
    country_id: chain.country_id != null ? Number(chain.country_id) : null,
    state: String(chain.state ?? ""),
    state_id: chain.state_id != null ? Number(chain.state_id) : null,
    municipality: String(chain.municipality ?? ""),
    municipality_id: chain.municipality_id != null ? Number(chain.municipality_id) : null,
    parish: String(chain.parish ?? ""),
    parish_id: chain.parish_id != null ? Number(chain.parish_id) : null,
    neighborhood: String(chain.neighborhood ?? ""),
    neighborhood_id: chain.neighborhood_id != null ? Number(chain.neighborhood_id) : null,
    full_path: String(chain.full_path ?? ""),
  };
}
// 🔹 Transformación estricta para PatientHeader
export function toPatientHeaderPatient(
  p: any
): PatientsPatient & { balance_due?: number; age?: number | null } {
  const full_name =
    p.full_name ??
    [p.first_name, p.middle_name, p.last_name, p.second_last_name].filter(Boolean).join(" ").trim();
  const age = p.age ?? calcAge(p.birthdate ?? null);
  const address_chain: AddressChain = normalizeAddressChain(p.address_chain);
  return {
    id: p.id,
    national_id: p.national_id ?? "",
    first_name: p.first_name ?? "",
    middle_name: p.middle_name ?? "",
    last_name: p.last_name ?? "",
    second_last_name: p.second_last_name ?? "",
    birthdate: p.birthdate ?? null,
    gender: p.gender ?? null,
    email: p.email ?? "",
    contact_info: p.contact_info ?? "",
    weight: p.weight ?? null,
    height: p.height ?? null,
    blood_type: p.blood_type ?? undefined,
    allergies: normalizeAllergies(p.allergies),
    medical_history: normalizeMedicalHistory(p.medical_history),
    active: p.active ?? true,
    created_at: p.created_at ?? null,
    updated_at: p.updated_at ?? null,
    full_name,
    balance_due: p.balance_due ?? undefined,
    age,
    address_chain,
  } as PatientsPatient & { balance_due?: number; age?: number | null };
}