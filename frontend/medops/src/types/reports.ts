// 🔹 Formatos de exportación disponibles
export enum ExportFormat {
  PDF = "pdf",
  EXCEL = "excel",
}

// 🔹 Tipos de reporte institucionales
export enum ReportType {
  FINANCIAL = "financial",
  CLINICAL = "clinical",
  COMBINED = "combined",
}

// 🔹 Estados de reporte institucionales
export enum ReportStatus {
  CONFIRMED = "confirmed",
  PENDING = "pending",
  CANCELLED = "cancelled",
  COMPLETED = "completed",
  FINALIZED = "finalized",
}

// 🔹 Filtros aplicables a los reportes
export interface ReportFiltersInput {
  start_date?: string;   // formato YYYY-MM-DD
  end_date?: string;     // formato YYYY-MM-DD
  type: ReportType;      // tipo de reporte institucional
}

// 🔹 Fila de reporte (resultado)
export interface ReportRow {
  id: number;
  date: string;          // fecha del evento (YYYY-MM-DD)
  type: ReportType;      // tipo de reporte institucional
  entity: string;        // paciente, procedimiento o entidad
  status: ReportStatus;  // estado institucional
  amount: number;        // monto asociado en USD
  currency: string;      // ⚔️ moneda asociada (ej: "USD", "VES")
}
