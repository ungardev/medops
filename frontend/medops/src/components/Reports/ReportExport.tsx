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
        {
          format,
          filters: filters ?? {}, // nunca enviamos null
          data,
        },
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
    <div className="flex gap-3">
      <button
        className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition text-sm"
        onClick={() => handleExport("pdf")}
      >
        Exportar PDF
      </button>
      <button
        className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 
                   bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 
                   hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm"
        onClick={() => handleExport("excel")}
      >
        Exportar Excel
      </button>
    </div>
  );
}
