// src/types/medicalReport.ts
// =====================================================
// IMPORTAR TIPOS DESDE config.ts
// =====================================================
import type { InstitutionSettings, DoctorConfig } from "./config";
// =====================================================
// INFORME MÉDICO GENERADO DESDE UNA CONSULTA/APPOINTMENT
// =====================================================
export interface MedicalReport {
  id: number;                // ID del informe
  appointment: number;       // ID de la consulta/appointment
  patient: number;           // ID del paciente
  created_at: string;        // Fecha/hora ISO de creación (ISO string)
  status: "generated";       // Estado del informe (por ahora siempre "generated")
  file_url?: string | null;  // URL del archivo PDF/HTML generado (opcional)
  // 🔹 Campos adicionales que devuelve generate_medical_report
  audit_code?: string | null; // Código de auditoría institucional
  qr_code_url?: string | null; // QR embebido en el informe (opcional)
  // 🔹 IMPORTADO desde config.ts para evitar duplicados
  institution?: InstitutionSettings | null; // Datos institucionales
  doctor?: DoctorConfig | null;           // Datos del médico operador (usar DoctorConfig en lugar de DoctorOperator)
}