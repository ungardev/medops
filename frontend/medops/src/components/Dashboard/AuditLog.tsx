// src/components/Dashboard/AuditLog.tsx
import React, { useState } from "react";
import { useAuditLogDirect } from "@/hooks/dashboard/useDashboard";
import type { EventLogEntry } from "@/types/dashboard";
import moment from "moment";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/solid";
import { useInstitutionSettings } from "@/hooks/settings/useInstitutionSettings";
import { useDoctorConfig } from "@/hooks/settings/useDoctorConfig";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const severityBadge = (severity?: string | null) => {
  const base = "inline-flex items-center justify-center px-2 py-0.5 text-[10px] rounded-[2px] font-bold border whitespace-nowrap uppercase tracking-tighter";
  switch ((severity || "").toLowerCase()) {
    case "alta":
    case "high":
      return <span className={`${base} bg-red-500/10 text-red-500 border-red-500/20`}>Critical</span>;
    case "media":
    case "medium":
      return <span className={`${base} bg-orange-500/10 text-orange-500 border-orange-500/20`}>Warning</span>;
    case "baja":
    case "low":
      return <span className={`${base} bg-emerald-500/10 text-emerald-500 border-emerald-500/20`}>Stable</span>;
    default:
      return <span className={`${base} bg-[var(--palantir-muted)]/10 text-[var(--palantir-muted)] border-[var(--palantir-border)]`}>Info</span>;
  }
};

const actionBadge = (action: string) => {
  const base = "inline-flex items-center justify-center px-2 py-0.5 text-[10px] rounded-[2px] font-mono font-bold border whitespace-nowrap uppercase tracking-tighter";
  const act = (action || "").toLowerCase();
  if (act.includes("create") || act.includes("creacion")) 
    return <span className={`${base} border-emerald-500/30 text-emerald-500 bg-emerald-500/5`}>OP_CREATE</span>;
  if (act.includes("update") || act.includes("actualizacion")) 
    return <span className={`${base} border-[var(--palantir-active)]/30 text-[var(--palantir-active)] bg-[var(--palantir-active)]/5`}>OP_UPDATE</span>;
  if (act.includes("delete") || act.includes("eliminacion")) 
    return <span className={`${base} border-red-500/30 text-red-500 bg-red-500/5`}>OP_DELETE</span>;
  return <span className={`${base} border-[var(--palantir-muted)]/30 text-[var(--palantir-muted)]`}>OP_EXEC</span>;
};

const AuditLog: React.FC = () => {
  const [expanded, setExpanded] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const { data: events, isLoading } = useAuditLogDirect(50);
  const { data: inst } = useInstitutionSettings();
  const { data: doc } = useDoctorConfig();

  const handleExportPDF = () => {
    const pdf = new jsPDF();
    pdf.setFontSize(14);
    pdf.text("MedOps — Auditoría en vivo", 14, 20);
    pdf.setFontSize(10);
    pdf.text(`Institución: ${inst?.name || ""}`, 14, 28);
    pdf.text(`Médico: ${doc?.full_name || ""}`, 14, 34);
    pdf.text(`Fecha: ${moment().format("YYYY-MM-DD HH:mm:ss")}`, 14, 40);

    autoTable(pdf, {
      startY: 50,
      head: [["Timestamp", "Usuario", "Entidad", "Acción", "Severidad"]],
      body: (events || []).map((e) => [
        moment(e.timestamp).format("YYYY-MM-DD HH:mm:ss"),
        e.actor,
        e.entity,
        e.action.toUpperCase(),
        e.severity?.toUpperCase() || "SIN SEVERIDAD",
      ]),
      headStyles: { fillColor: [24, 32, 38], textColor: 255 },
      styles: { fontSize: 8 },
    });
    pdf.save("audit-log.pdf");
  };

  const handleExportCSV = () => {
    const rows = (events || []).map((e) =>
      [moment(e.timestamp).format("YYYY-MM-DD HH:mm:ss"), e.actor, e.entity, e.action, e.severity || "INFO"].join(",")
    );
    const csvContent = ["Timestamp,Usuario,Entidad,Acción,Severidad", ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "audit-log.csv");
    link.click();
  };

  return (
    /* Eliminado overflow-hidden para permitir que el dropdown sea visible */
    <div className="bg-[var(--palantir-surface)] border border-[var(--palantir-border)] rounded-sm relative z-20">
      {/* Header */}
      <div className="px-4 py-3 bg-[var(--palantir-bg)]/30 border-b border-[var(--palantir-border)] flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--palantir-muted)]">Auditoría Operacional</h3>
          <span className="text-[9px] font-mono text-[var(--palantir-active)] bg-[var(--palantir-active)]/10 px-1.5 py-0.5 rounded border border-[var(--palantir-active)]/20">LIVE_LOG</span>
        </div>

        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase border border-[var(--palantir-border)] rounded-sm text-[var(--palantir-muted)] hover:text-[var(--palantir-text)] hover:bg-[var(--palantir-bg)] transition-all"
          >
            {expanded ? "Ocultar Datos" : "Ver Datos"}
            {expanded ? <ChevronUpIcon className="w-3 h-3" /> : <ChevronDownIcon className="w-3 h-3" />}
          </button>

          <div className="relative">
            <button
              onClick={() => setExportOpen(!exportOpen)}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase border border-[var(--palantir-border)] rounded-sm bg-[var(--palantir-active)]/10 text-[var(--palantir-active)] hover:bg-[var(--palantir-active)]/20 transition-all"
            >
              Exportar
              <ChevronDownIcon className={`w-3 h-3 transition-transform ${exportOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {exportOpen && (
              /* Ajustado: Si no está expandido, el menú abre hacia arriba (bottom-full mb-2) */
              <div className={`absolute right-0 w-44 bg-[var(--palantir-surface)] border border-[var(--palantir-border)] rounded-sm shadow-2xl z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${expanded ? 'top-full mt-2' : 'bottom-full mb-2'}`}>
                <button
                  onClick={() => { handleExportPDF(); setExportOpen(false); }}
                  className="w-full text-left px-4 py-2.5 text-[10px] font-bold uppercase text-[var(--palantir-muted)] hover:bg-[var(--palantir-active)]/10 hover:text-[var(--palantir-active)] transition-colors"
                >
                  Reporte PDF (Full)
                </button>
                <button
                  onClick={() => { handleExportCSV(); setExportOpen(false); }}
                  className="w-full text-left px-4 py-2.5 text-[10px] font-bold uppercase text-[var(--palantir-muted)] hover:bg-[var(--palantir-active)]/10 hover:text-[var(--palantir-active)] border-t border-[var(--palantir-border)] transition-colors"
                >
                  Archivo CSV (Raw)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabla Desplegable */}
      {expanded && (
        <div className="animate-in slide-in-from-top-2 duration-300 overflow-hidden border-t border-[var(--palantir-border)]/10">
          {isLoading ? (
            <div className="p-8 text-center text-[10px] font-mono text-[var(--palantir-muted)] italic">FETCHING_LOGS...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left border-collapse">
                <thead className="bg-[var(--palantir-bg)]/50">
                  <tr>
                    <th className="px-4 py-2.5 text-[9px] font-bold uppercase tracking-widest text-[var(--palantir-muted)] border-b border-[var(--palantir-border)]">Timestamp</th>
                    <th className="px-4 py-2.5 text-[9px] font-bold uppercase tracking-widest text-[var(--palantir-muted)] border-b border-[var(--palantir-border)]">Principal_Actor</th>
                    <th className="px-4 py-2.5 text-[9px] font-bold uppercase tracking-widest text-[var(--palantir-muted)] border-b border-[var(--palantir-border)]">Target_Entity</th>
                    <th className="px-4 py-2.5 text-[9px] font-bold uppercase tracking-widest text-[var(--palantir-muted)] border-b border-[var(--palantir-border)]">Action</th>
                    <th className="px-4 py-2.5 text-[9px] font-bold uppercase tracking-widest text-[var(--palantir-muted)] border-b border-[var(--palantir-border)]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--palantir-border)]/50">
                  {(events || []).slice(0, 10).map((entry: EventLogEntry) => (
                    <tr key={entry.id} className="hover:bg-[var(--palantir-active)]/[0.03] transition-colors">
                      <td className="px-4 py-2.5 text-[10px] font-mono text-[var(--palantir-muted)] whitespace-nowrap">
                        {moment(entry.timestamp).format("YYYY.MM.DD HH:mm:ss")}
                      </td>
                      <td className="px-4 py-2.5 text-[11px] font-bold text-[var(--palantir-text)] uppercase whitespace-nowrap">
                        {entry.actor}
                      </td>
                      <td className="px-4 py-2.5 text-[10px] text-[var(--palantir-muted)] uppercase tracking-tight">
                        {entry.entity}
                      </td>
                      <td className="px-4 py-2.5">
                        {actionBadge(entry.action)}
                      </td>
                      <td className="px-4 py-2.5">
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
