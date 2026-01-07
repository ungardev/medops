// src/components/Reports/ReportExport.tsx
import React, { useState } from "react";
import { ExportFormat, ReportFiltersInput, ReportRow } from "@/types/reports";
import { 
  DocumentArrowDownIcon, 
  TableCellsIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";

interface Props {
  filters: ReportFiltersInput | null;
  data: ReportRow[];
}

export default function ReportExport({ filters, data }: Props) {
  const [isExporting, setIsExporting] = useState<ExportFormat | null>(null);

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(format);
    try {
      const token = localStorage.getItem("authToken");

      const serializedData = data.map((row) => ({
        id: row.id,
        date: row.date,
        type: row.type,
        entity: row.entity,
        status: row.status,
        amount: row.amount,
        currency: row.currency,
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
            filters: filters ?? {},
            data: serializedData,
          }),
          credentials: "include",
        }
      );

      if (!response.ok) throw new Error("EXPORT_PROTOCOL_FAILURE");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download =
        format === ExportFormat.PDF
          ? `REP_SYS_${Date.now()}.pdf`
          : `REP_SYS_${Date.now()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Critical Export Error:", error);
      alert("ERROR: System_failed_to_package_report");
    } finally {
      setIsExporting(null);
    }
  };

  const buttonBase = `
    relative flex items-center justify-center gap-3 px-6 py-2.5 
    text-[10px] font-black uppercase tracking-[0.2em] transition-all 
    disabled:opacity-40 disabled:cursor-not-allowed border rounded-sm
  `;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
      
      {/* 🔴 PROTOCOLO PDF */}
      <button
        disabled={!!isExporting || data.length === 0}
        onClick={() => handleExport(ExportFormat.PDF)}
        className={`${buttonBase} w-full sm:w-auto
          bg-red-500/10 border-red-500/20 text-red-400
          hover:bg-red-500/20 hover:border-red-500/40`}
      >
        {isExporting === ExportFormat.PDF ? (
          <ArrowPathIcon className="w-4 h-4 animate-spin" />
        ) : (
          <DocumentArrowDownIcon className="w-4 h-4" />
        )}
        {isExporting === ExportFormat.PDF ? "Packaging_PDF..." : "Export_PDF_Format"}
      </button>

      {/* 🟢 PROTOCOLO EXCEL */}
      <button
        disabled={!!isExporting || data.length === 0}
        onClick={() => handleExport(ExportFormat.EXCEL)}
        className={`${buttonBase} w-full sm:w-auto
          bg-emerald-500/10 border-emerald-500/20 text-emerald-400
          hover:bg-emerald-500/20 hover:border-emerald-500/40`}
      >
        {isExporting === ExportFormat.EXCEL ? (
          <ArrowPathIcon className="w-4 h-4 animate-spin" />
        ) : (
          <TableCellsIcon className="w-4 h-4" />
        )}
        {isExporting === ExportFormat.EXCEL ? "Compiling_XLSX..." : "Export_Excel_Data"}
      </button>

      {/* 🧩 DATA COUNTER SUTIL */}
      <div className="hidden lg:block ml-4 pl-4 border-l border-white/10">
        <span className="text-[8px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest block">
          Buffer_Status
        </span>
        <span className="text-[10px] font-mono text-white/60">
          {data.length.toString().padStart(3, '0')} ROWS_READ
        </span>
      </div>
    </div>
  );
}
