// src/components/Dashboard/AuditLog.tsx
import React, { useState } from "react";
import { useAuditLogDirect } from "@/hooks/dashboard/useDashboard";
import type { EventLogEntry } from "@/types/dashboard";
import moment from "moment";
import { ChevronDownIcon, ChevronUpIcon, TableCellsIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { useInstitutionSettings } from "@/hooks/settings/useInstitutionSettings";
import { useDoctorConfig } from "@/hooks/settings/useDoctorConfig";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
const severityBadge = (severity?: string | null) => {
  const base = "inline-flex items-center justify-center px-2.5 py-1 text-[9px] rounded-full font-semibold border whitespace-nowrap uppercase tracking-wider";
  switch ((severity || "").toLowerCase()) {
    case "alta":
    case "high":
      return <span className={`${base} bg-red-500/15 text-red-400 border-red-500/25`}>Crítico</span>;
    case "media":
    case "medium":
      return <span className={`${base} bg-amber-500/15 text-amber-400 border-amber-500/25`}>Advertencia</span>;
    case "baja":
    case "low":
      return <span className={`${base} bg-emerald-500/15 text-emerald-400 border-emerald-500/25`}>Estable</span>;
    default:
      return <span className={`${base} bg-white/5 text-white/50 border-white/10`}>Info</span>;
  }
};
const actionBadge = (action: string) => {
  const base = "inline-flex items-center justify-center px-2.5 py-1 text-[9px] rounded-full font-medium border whitespace-nowrap uppercase tracking-wider";
  const act = (action || "").toLowerCase();
  if (act.includes("create")) 
    return <span className={`${base} border-emerald-500/25 text-emerald-400 bg-emerald-500/10`}>Creación</span>;
  if (act.includes("update")) 
    return <span className={`${base} border-blue-500/25 text-blue-400 bg-blue-500/10`}>Actualización</span>;
  if (act.includes("delete")) 
    return <span className={`${base} border-red-500/25 text-red-400 bg-red-500/10`}>Eliminación</span>;
  return <span className={`${base} border-white/15 text-white/60 bg-white/5`}>Ejecutado</span>;
};
const AuditLog: React.FC = () => {
  const [expanded, setExpanded] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const { data: events, isLoading } = useAuditLogDirect(50);
  const { data: inst } = useInstitutionSettings();
  const { data: doctor } = useDoctorConfig();
  const handleExportPDF = () => {
    if (!events || events.length === 0) {
      alert("No hay datos para exportar");
      return;
    }
    const pdfDoc = new jsPDF();
    const institutionName = inst?.name || "MEDOPZ";
    const doctorName = doctor?.full_name || "Doctor";
    const currentDate = moment().format("DD/MM/YYYY HH:mm");
    pdfDoc.setFontSize(18);
    pdfDoc.text("Registro de Auditoría", 14, 22);
    
    pdfDoc.setFontSize(10);
    pdfDoc.setTextColor(100);
    pdfDoc.text(`Institución: ${institutionName}`, 14, 32);
    pdfDoc.text(`Doctor: ${doctorName}`, 14, 38);
    pdfDoc.text(`Fecha: ${currentDate}`, 14, 44);
    const tableData = events.slice(0, 50).map((entry: EventLogEntry) => [
      moment(entry.timestamp).format("DD/MM/YYYY HH:mm:ss"),
      entry.actor || "Sistema",
      entry.entity || "N/A",
      entry.action || "N/A",
      entry.severity || "INFO",
      entry.metadata?.description || entry.metadata?.notes || ""
    ]);
    autoTable(pdfDoc, {
      startY: 50,
      head: [["Fecha/Hora", "Actor", "Entidad", "Acción", "Severidad", "Descripción"]],
      body: tableData,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });
    pdfDoc.setFontSize(8);
    pdfDoc.setTextColor(150);
    const pageSize = pdfDoc.internal.pageSize;
    const pageCount = (pdfDoc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdfDoc.setPage(i);
      pdfDoc.text(
        `Página ${i} de ${pageCount} - Documento generado por MEDOPZ`,
        pageSize.getWidth() / 2,
        pageSize.getHeight() - 10,
        { align: "center" }
      );
    }
    pdfDoc.save(`audit_log_${moment().format("YYYYMMDD_HHmmss")}.pdf`);
    setExportOpen(false);
  };
  const handleExportCSV = () => {
    if (!events || events.length === 0) {
      alert("No hay datos para exportar");
      return;
    }
    const headers = ["Fecha/Hora", "Actor", "Entidad", "Acción", "Severidad", "Descripción"];
    const rows = events.slice(0, 50).map((entry: EventLogEntry) => [
      moment(entry.timestamp).format("YYYY-MM-DD HH:mm:ss"),
      entry.actor || "",
      entry.entity || "",
      entry.action || "",
      entry.severity || "",
      entry.metadata?.description || entry.metadata?.notes || ""
    ]);
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `audit_log_${moment().format("YYYYMMDD_HHmmss")}.csv`;
    link.click();
    setExportOpen(false);
  };
  return (
    <div className="bg-white/5 border border-white/15 rounded-lg overflow-hidden transition-all duration-500">
      {/* Header */}
      <div className="px-5 py-4 bg-white/5 border-b border-white/15 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
            <TableCellsIcon className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-[12px] font-semibold text-white">Registro de Auditoría</h3>
            <div className="flex items-center gap-2 mt-0.5">
               <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
               <span className="text-[9px] text-white/50 font-medium">Actividad en tiempo real</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 px-4 py-2 text-[11px] font-medium border border-white/15 rounded-lg text-white/60 hover:text-white hover:bg-white/5 hover:border-white/25 transition-all"
          >
            {expanded ? "Ocultar" : "Ver Registros"}
            {expanded ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
          </button>
          <div className="relative">
            <button
              onClick={() => setExportOpen(!exportOpen)}
              className="flex items-center gap-2 px-4 py-2 text-[11px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25 transition-all rounded-lg"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              Exportar
            </button>
            
            {exportOpen && (
              <div className="absolute right-0 mt-2 bg-[#1a1a1b] border border-white/15 rounded-lg shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2" style={{ minWidth: "200px" }}>
                <button 
                  onClick={handleExportPDF} 
                  className="w-full text-left px-4 py-3 text-[11px] font-medium text-white/70 hover:bg-emerald-500/10 hover:text-emerald-400 transition-all block"
                >
                  Exportar como PDF
                </button>
                <button 
                  onClick={handleExportCSV} 
                  className="w-full text-left px-4 py-3 text-[11px] font-medium text-white/70 hover:bg-emerald-500/10 hover:text-emerald-400 border-t border-white/10 transition-all block"
                >
                  Exportar como CSV
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Tabla */}
      {expanded && (
        <div className="animate-in slide-in-from-top-2 duration-500 overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-[11px] text-white/40 animate-pulse">Cargando registros...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5">
                    <th className="px-6 py-3 text-[10px] font-medium uppercase tracking-wider text-white/50 border-b border-white/10">Fecha/Hora</th>
                    <th className="px-6 py-3 text-[10px] font-medium uppercase tracking-wider text-white/50 border-b border-white/10">Actor</th>
                    <th className="px-6 py-3 text-[10px] font-medium uppercase tracking-wider text-white/50 border-b border-white/10">Entidad</th>
                    <th className="px-6 py-3 text-[10px] font-medium uppercase tracking-wider text-white/50 border-b border-white/10">Acción</th>
                    <th className="px-6 py-3 text-[10px] font-medium uppercase tracking-wider text-white/50 border-b border-white/10">Severidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(events || []).slice(0, 15).map((entry: EventLogEntry) => (
                    <tr key={entry.id} className="group hover:bg-white/5 transition-colors">
                      <td className="px-6 py-3 text-[11px] text-white/50 group-hover:text-white/70">
                        {moment(entry.timestamp).format("DD/MM/YYYY HH:mm:ss")}
                      </td>
                      <td className="px-6 py-3 text-[11px] font-medium text-white/80">
                        <span className="bg-white/5 px-2.5 py-1 rounded-md border border-white/10">{entry.actor}</span>
                      </td>
                      <td className="px-6 py-3 text-[11px] text-white/60 font-medium group-hover:text-white/80 transition-colors">
                        {entry.entity}
                      </td>
                      <td className="px-6 py-3">
                        {actionBadge(entry.action)}
                      </td>
                      <td className="px-6 py-3">
                        {severityBadge(entry.severity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default AuditLog;