// --- Informe Médico generado desde una consulta/appointment
export interface MedicalReport {
  id: number;                // ID del informe
  appointment: number;       // ID de la consulta/appointment
  patient: number;           // ID del paciente
  created_at: string;        // Fecha/hora ISO de creación
  status: "generated";       // Estado del informe (por ahora siempre "generated")
  file_url?: string | null;  // URL del archivo PDF/HTML generado (opcional)
}
