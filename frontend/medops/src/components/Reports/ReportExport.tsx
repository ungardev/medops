// src/components/Reports/ReportExport.tsx
import React from "react";
import { ExportFormat, ReportFiltersInput, ReportRow } from "@/types/reports";

interface Props {
  filters: ReportFiltersInput | null;
  data: ReportRow[];
}

export default function ReportExport({ filters, data }: Props) {
  const handleExport = async (format: ExportFormat) => {
    try {
      const token = localStorage.getItem("authToken");

      // ⚔️ Serializamos las filas a JSON plano
      const serializedData = data.map((row) => ({
        id: row.id,
        date: row.date, // ya es string según tu tipo
        type: row.type,
        entity: row.entity,
        status: row.status,
        amount: row.amount,
        currency: row.currency, // ahora definido en ReportRow
      }));

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/reports/export/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Token ${token}` } : {}),
          },
          body: JSON.stringify({
            format,
            filters: filters ?? {}, // nunca enviamos null
            data: serializedData,
          }),
          credentials: "include",
        }
      );

      if (!response.ok) throw new Error("Error exportando reporte");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download =
        format === ExportFormat.PDF
          ? "reporte_institucional.pdf"
          : "reporte_institucional.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exportando reporte:", error);
      alert("Error al exportar el reporte");
    }
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:justify-start">
      <button
        className="w-full sm:w-auto px-4 py-2 rounded-md bg-[#0d2c53] text-white hover:bg-[#0b2444] transition text-sm"
        onClick={() => handleExport(ExportFormat.PDF)}
      >
        Exportar PDF
      </button>
      <button
        className="w-full sm:w-auto px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 
                   bg-gray-100 dark:bg-gray-700 text-[#0d2c53] dark:text-gray-200 
                   hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm"
        onClick={() => handleExport(ExportFormat.EXCEL)}
      >
        Exportar Excel
      </button>
    </div>
  );
}
