// --- Informe Médico generado desde una consulta/appointment
export interface MedicalReport {
  id: number;                // ID del informe
  appointment: number;       // ID de la consulta/appointment
  patient: number;           // ID del paciente
  created_at: string;        // Fecha/hora ISO de creación (ISO string)
  status: "generated";       // Estado del informe (por ahora siempre "generated")
  file_url?: string | null;  // URL del archivo PDF/HTML generado (opcional)

  institution?: InstitutionSettings | null; // 🔹 Datos institucionales
  doctor?: DoctorOperator | null;           // 🔹 Datos del médico operador
}

// --- Datos institucionales (InstitutionSettingsSerializer)
export interface InstitutionSettings {
  id: number;
  name: string;
  address: string;
  phone: string;
  logo?: string | null;   // URL completa del logo institucional
  tax_id: string;
}

// --- Datos del médico operador (DoctorOperatorSerializer)
export interface DoctorOperator {
  id: number;
  full_name: string;
  colegiado_id: string;
  specialty: string;
  license: string;
  email: string;
  phone: string;
  signature?: string | null; // URL completa de la firma digital
}
