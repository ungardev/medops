// src/components/Reports/ReportExport.tsx
import React from "react";
import { ExportFormat } from "@/types/reports";

interface Props {
  onExport: (format: ExportFormat) => void;
}

export default function ReportExport({ onExport }: Props) {
  return (
    <div className="export-actions">
      <button className="btn btn-outline" onClick={() => onExport("pdf")}>
        Exportar PDF
      </button>
      <button className="btn btn-outline" onClick={() => onExport("excel")}>
        Exportar Excel
      </button>
    </div>
  );
}
