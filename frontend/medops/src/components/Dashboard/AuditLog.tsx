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
  const base = "inline-flex items-center justify-center px-2 py-1 text-[9px] rounded-sm font-black border whitespace-nowrap uppercase tracking-widest transition-all duration-300";
  switch ((severity || "").toLowerCase()) {
    case "alta":
    case "high":
      return <span className={`${base} bg-red-500/20 text-red-400 border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.2)]`}>CRITICAL</span>;
    case "media":
    case "medium":
      return <span className={`${base} bg-orange-500/20 text-orange-400 border-orange-500/40`}>WARNING</span>;
    case "baja":
    case "low":
      return <span className={`${base} bg-emerald-500/20 text-emerald-400 border-emerald-500/40`}>STABLE</span>;
    default:
      return <span className={`${base} bg-white/5 text-white/40 border-white/10`}>INFO</span>;
  }
};
const actionBadge = (action: string) => {
  const base = "inline-flex items-center justify-center px-2 py-0.5 text-[9px] rounded-sm font-mono font-bold border whitespace-nowrap uppercase tracking-tighter transition-all";
  const act = (action || "").toLowerCase();
  if (act.includes("create")) 
    return <span className={`${base} border-emerald-500/40 text-emerald-400 bg-emerald-500/10`}>OP_CREATE</span>;
  if (act.includes("update")) 
    return <span className={`${base} border-[var(--palantir-active)]/40 text-[var(--palantir-active)] bg-[var(--palantir-active)]/10`}>OP_UPDATE</span>;
  if (act.includes("delete")) 
    return <span className={`${base} border-red-500/40 text-red-400 bg-red-500/10`}>OP_DELETE</span>;
  return <span className={`${base} border-white/20 text-white/60 bg-white/5`}>OP_EXEC</span>;
};
const AuditLog: React.FC = () => {
  const [expanded, setExpanded] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const { data: events, isLoading } = useAuditLogDirect(50);
  const { data: inst } = useInstitutionSettings();
  const { data: doctor } = useDoctorConfig();
  // ✅ IMPLEMENTACIÓN: Exportar PDF
  const handleExportPDF = () => {
    if (!events || events.length === 0) {
      alert("No hay datos para exportar");
      return;
    }
    const pdfDoc = new jsPDF();
    const institutionName = inst?.name || "MEDOPZ";
    const doctorName = doctor?.full_name || "Doctor";
    const currentDate = moment().format("DD/MM/YYYY HH:mm");
    // Header
    pdfDoc.setFontSize(18);
    pdfDoc.text("REGISTRO DE AUDITORÍA", 14, 22);
    
    pdfDoc.setFontSize(10);
    pdfDoc.setTextColor(100);
    pdfDoc.text(`Institución: ${institutionName}`, 14, 32);
    pdfDoc.text(`Doctor: ${doctorName}`, 14, 38);
    pdfDoc.text(`Fecha de Exportación: ${currentDate}`, 14, 44);
    // Tabla
    const tableData = events.slice(0, 50).map((entry: EventLogEntry) => [
      moment(entry.timestamp).format("DD/MM/YYYY HH:mm:ss"),
      entry.actor || "System",
      entry.entity || "N/A",
      entry.action || "N/A",
      entry.severity || "INFO",
      entry.metadata?.description || entry.metadata?.notes || ""
    ]);
    autoTable(pdfDoc, {
      startY: 50,
      head: [["Fecha/Hora", "Actor", "Entidad", "Acción", "Severidad", "Descripción"]],
      body: tableData,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [40, 40, 40],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });
    // Footer
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
  // ✅ IMPLEMENTACIÓN: Exportar CSV
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
    <div className="bg-black/40 border border-white/10 rounded-sm relative z-20 backdrop-blur-md overflow-hidden transition-all duration-500">
      {/* Header Táctico */}
      <div className="px-5 py-4 bg-white/[0.03] border-b border-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-[var(--palantir-active)]/10 rounded-sm border border-[var(--palantir-active)]/20">
            <TableCellsIcon className="w-4 h-4 text-[var(--palantir-active)]" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/90">Registro de Auditoría</h3>
            <div className="flex items-center gap-2 mt-0.5">
               <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
               <span className="text-[8px] font-mono text-white/30 uppercase tracking-widest font-bold">Live_System_Stream</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest border border-white/10 rounded-sm text-white/60 hover:text-white hover:bg-white/5 hover:border-white/20 transition-all"
          >
            {expanded ? "Ocultar Monitor" : "Desplegar Monitor"}
            {expanded ? <ChevronUpIcon className="w-3 h-3" /> : <ChevronDownIcon className="w-3 h-3" />}
          </button>
          {/* ✅ FIX: Dropdown con z-index alto y fixed */}
          <div className="relative">
            <button
              onClick={() => setExportOpen(!exportOpen)}
              className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-[var(--palantir-active)] text-black font-bold hover:brightness-110 transition-all rounded-sm"
            >
              <ArrowDownTrayIcon className="w-3 h-3 stroke-[3px]" />
              Exportar
            </button>
            
            {exportOpen && (
              <div className="fixed bg-[#0f1115] border border-white/10 rounded-sm shadow-2xl z-[9999] mt-2 overflow-hidden animate-in fade-in slide-in-from-top-2" style={{ minWidth: "180px" }}>
                <button 
                  onClick={handleExportPDF} 
                  className="w-full text-left px-4 py-3 text-[9px] font-black uppercase text-white/60 hover:bg-[var(--palantir-active)] hover:text-black transition-all block"
                >
                  Generar PDF Operativo
                </button>
                <button 
                  onClick={handleExportCSV} 
                  className="w-full text-left px-4 py-3 text-[9px] font-black uppercase text-white/60 hover:bg-[var(--palantir-active)] hover:text-black border-t border-white/5 transition-all block"
                >
                  Raw Data CSV
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Tabla con Visualización de Datos */}
      {expanded && (
        <div className="animate-in slide-in-from-top-2 duration-500 overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-[10px] font-mono text-white/20 animate-pulse uppercase tracking-[0.5em]">Syncing_Database_Logs...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/[0.02]">
                    <th className="px-6 py-3 text-[9px] font-black uppercase tracking-[0.3em] text-white/30 border-b border-white/5">Reloj_Sistema</th>
                    <th className="px-6 py-3 text-[9px] font-black uppercase tracking-[0.3em] text-white/30 border-b border-white/5">Actor_Principal</th>
                    <th className="px-6 py-3 text-[9px] font-black uppercase tracking-[0.3em] text-white/30 border-b border-white/5">Entidad_Objetivo</th>
                    <th className="px-6 py-3 text-[9px] font-black uppercase tracking-[0.3em] text-white/30 border-b border-white/5">Protocolo_Acción</th>
                    <th className="px-6 py-3 text-[9px] font-black uppercase tracking-[0.3em] text-white/30 border-b border-white/5">Status_Net</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {(events || []).slice(0, 15).map((entry: EventLogEntry) => (
                    <tr key={entry.id} className="group hover:bg-[var(--palantir-active)]/[0.04] transition-all duration-200">
                      <td className="px-6 py-3 text-[10px] font-mono text-white/40 group-hover:text-white/80">
                        {moment(entry.timestamp).format("HH:mm:ss.SSS")}
                      </td>
                      <td className="px-6 py-3 text-[11px] font-black text-white uppercase tracking-wider">
                        <span className="bg-white/5 px-2 py-1 rounded-sm border border-white/5">{entry.actor}</span>
                      </td>
                      <td className="px-6 py-3 text-[10px] text-white/60 font-bold uppercase group-hover:text-white transition-colors">
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