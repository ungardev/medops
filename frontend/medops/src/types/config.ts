// src/types/config.ts

// 🔹 Configuración institucional
export interface InstitutionSettings {
  id?: number;                 // opcional para evitar errores en estado inicial
  name: string;                // nombre de la clínica/institución
  address: string;             // dirección física
  phone: string;               // teléfono de contacto
  tax_id: string;              // RIF / identificación fiscal
  logo?: string | File;        // puede ser URL (string) o archivo (File) para upload
}

// 🔹 Configuración del médico operador
export interface DoctorConfig {
  id?: number;                 // opcional para evitar errores en estado inicial
  full_name: string;           // snake_case para coincidir con backend
  colegiado_id: string;        // snake_case para coincidir con backend
  specialty?: string;          // especialidad médica
  license?: string;            // número de licencia
  email?: string;              // correo electrónico
  phone?: string;              // teléfono de contacto
  signature?: string | File;   // puede ser URL (string) o archivo (File) para upload
}
