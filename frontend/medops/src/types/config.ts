// 🔹 Configuración institucional
export interface InstitutionSettings {
  id?: number;
  name: string;
  address: string;
  phone: string;
  tax_id: string;
  logo?: string | File | null;
}

// 🔹 Especialidad del médico
export interface Specialty {
  id: number;
  code: string;
  name: string;
}

// 🔹 Configuración del médico operador
export interface DoctorConfig {
  id?: number;
  full_name?: string;
  colegiado_id?: string;

  specialty_ids?: number[];      // IDs numéricos para backend
  specialties?: Specialty[];     // objetos para UI

  license?: string;
  email?: string;
  phone?: string;

  // ✅ FIX CRÍTICO: aceptar null porque el backend devuelve null
  signature?: string | File | null;
}
