// Formatos de exportación disponibles
export type ExportFormat = "pdf" | "excel";

// Filtros aplicables a los reportes
export interface ReportFiltersInput {
  start_date?: string;   // formato YYYY-MM-DD
  end_date?: string;     // formato YYYY-MM-DD
  type: "financial" | "clinical" | "combined";
}

// Fila de reporte (resultado)
export interface ReportRow {
  id: number;
  date: string;        // fecha del evento (YYYY-MM-DD)
  type: string;        // tipo de reporte (financial, clinical, etc.)
  entity: string;      // paciente, procedimiento o entidad
  status: string;      // estado (confirmed, pending, cancelled, completed)
  amount: number;      // monto asociado en USD
}
