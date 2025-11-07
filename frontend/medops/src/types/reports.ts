// src/types/reports.ts

// Formatos de exportación disponibles
export type ExportFormat = "pdf" | "excel";

// Filtros aplicables a los reportes
export interface ReportFiltersInput {
  dateFrom?: string;   // formato YYYY-MM-DD
  dateTo?: string;     // formato YYYY-MM-DD
  type: "financial" | "clinical" | "combined";
}

// Fila de reporte (resultado)
export interface ReportRow {
  id: number;
  date: string;        // fecha del evento
  type: string;        // tipo de reporte (financiero, clínico, etc.)
  entity: string;      // paciente, procedimiento o entidad
  status: string;      // estado (Completado, Pendiente, Cancelado)
  amount: number;      // monto asociado
}
