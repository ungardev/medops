// src/components/Reports/ReportExport.tsx
import React from "react";
import axios from "axios";
import { ExportFormat, ReportFiltersInput, ReportRow } from "@/types/reports";

interface Props {
  filters: ReportFiltersInput | null;
  data: ReportRow[];
}

export default function ReportExport({ filters, data }: Props) {
  const handleExport = async (format: ExportFormat) => {
    try {
      const response = await axios.post<Blob>(
        "/reports/export/",
        { format, filters, data },
        { responseType: "blob" }
      );

      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download =
        format === "pdf"
          ? "reporte_institucional.pdf"
          : "reporte_institucional.xlsx";
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exportando reporte:", error);
      alert("Error al exportar el reporte");
    }
  };

  return (
    <div className="export-actions">
      <button className="btn btn-outline" onClick={() => handleExport("pdf")}>
        Exportar PDF
      </button>
      <button className="btn btn-outline" onClick={() => handleExport("excel")}>
        Exportar Excel
      </button>
    </div>
  );
}
