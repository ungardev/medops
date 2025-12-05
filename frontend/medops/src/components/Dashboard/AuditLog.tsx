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

const AuditLog: React.FC = () => {
  const [expanded, setExpanded] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const { data: events, isLoading } = useAuditLogDirect(50);
  const { data: inst } = useInstitutionSettings();
  const { data: doc } = useDoctorConfig();

  // Badges compactos, sobrios y sin desbordes en tablet (desktop intacto).
  const severityBadge = (severity?: string | null) => {
    const base =
      "inline-flex items-center justify-center px-2 py-[2px] text-[11px] md:text-xs rounded font-medium ring-1 ring-inset whitespace-nowrap max-w-[96px] md:max-w-[110px] overflow-hidden truncate";
    switch ((severity || "").toLowerCase()) {
      case "alta":
      case "high":
        return <span className={`${base} bg-red-100 text-red-800 ring-red-300`}>Alta</span>;
      case "media":
      case "medium":
        return <span className={`${base} bg-yellow-100 text-yellow-800 ring-yellow-300`}>Media</span>;
      case "baja":
      case "low":
        return <span className={`${base} bg-green-100 text-green-800 ring-green-300`}>Baja</span>;
      case "info":
        return <span className={`${base} bg-blue-100 text-blue-800 ring-blue-300`}>Info</span>;
      default:
        return (
          <span className={`${base} bg-gray-100 text-gray-800 ring-gray-300`}>
            {severity?.toUpperCase() || "Sin severidad"}
          </span>
        );
    }
  };

  const actionBadge = (action: string) => {
    const base =
      "inline-flex items-center justify-center px-2 py-[2px] text-[11px] md:text-xs rounded font-medium ring-1 ring-inset whitespace-nowrap max-w-[120px] md:max-w-[140px] overflow-hidden truncate";
    switch ((action || "").toLowerCase()) {
      case "creacion":
      case "create":
        return <span className={`${base} bg-green-100 text-green-800 ring-green-300`}>Creación</span>;
      case "actualizacion":
      case "update":
        return <span className={`${base} bg-blue-100 text-blue-800 ring-blue-300`}>Actualización</span>;
      case "eliminacion":
      case "delete":
        return <span className={`${base} bg-red-100 text-red-800 ring-red-300`}>Eliminación</span>;
      case "generacion_pdf":
      case "export_pdf":
        return <span className={`${base} bg-purple-100 text-purple-800 ring-purple-300`}>Generación PDF</span>;
      default:
        return (
          <span className={`${base} bg-gray-100 text-gray-800 ring-gray-300`}>
            {action.toUpperCase()}
          </span>
        );
    }
  };

  const handleExportPDF = () => {
    const pdf = new jsPDF();
    pdf.setFontSize(14);
    pdf.text("MedOps — Auditoría en vivo", 14, 20);
    pdf.setFontSize(10);
    pdf.text(`Institución: ${inst?.name || ""}`, 14, 28);
    pdf.text(`RIF/NIT: ${inst?.tax_id || ""}`, 14, 34);
    pdf.text(`Dirección: ${inst?.address || ""}`, 14, 40);
    pdf.text(`Teléfono: ${inst?.phone || ""}`, 14, 46);
    pdf.text(`Médico Operador: ${doc?.full_name || ""}`, 14, 54);
    pdf.text(`Colegiado: ${doc?.colegiado_id || ""}`, 14, 60);
    pdf.text(`Licencia: ${doc?.license || ""}`, 14, 66);
    pdf.text(`Fecha exportación: ${moment().format("YYYY-MM-DD HH:mm:ss")}`, 14, 72);

    autoTable(pdf, {
      startY: 80,
      head: [["Timestamp", "Usuario", "Entidad", "Acción", "Severidad"]],
      body: (events || []).slice(0, 50).map((e) => [
        moment(e.timestamp).format("YYYY-MM-DD HH:mm:ss"),
        e.actor,
        e.entity,
        e.action.toUpperCase(),
        e.severity?.toUpperCase() || "SIN SEVERIDAD",
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [240, 240, 240], textColor: 50 },
      alternateRowStyles: { fillColor: [250, 250, 250] },
    });

    pdf.save("audit-log.pdf");
  };

  const handleExportCSV = () => {
    const header = [
      "Institución", inst?.name || "",
      "RIF/NIT", inst?.tax_id || "",
      "Dirección", inst?.address || "",
      "Teléfono", inst?.phone || "",
      "Médico Operador", doc?.full_name || "",
      "Colegiado", doc?.colegiado_id || "",
      "Licencia", doc?.license || "",
      "Fecha exportación", moment().format("YYYY-MM-DD HH:mm:ss"),
    ].join(",");

    const rows = (events || []).slice(0, 50).map((e) =>
      [
        moment(e.timestamp).format("YYYY-MM-DD HH:mm:ss"),
        e.actor,
        e.entity,
        e.action.toUpperCase(),
        e.severity?.toUpperCase() || "SIN SEVERIDAD",
      ].join(",")
    );

    const csvContent = [header, "Timestamp,Usuario,Entidad,Acción,Severidad", ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "audit-log.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section className="bg-white dark:bg-gray-800 rounded-lg shadow px-4 sm:px-6 py-4 sm:py-3 space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 text-center md:text-left">
          Auditoría en vivo
        </h3>
        {/* Controles compactos para tablet; desktop intacto */}
        <div className="flex flex-row flex-wrap md:flex-nowrap items-center justify-center md:justify-end gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {expanded ? "Ocultar" : "Mostrar"}
            {expanded ? (
              <ChevronUpIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            ) : (
              <ChevronDownIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            )}
          </button>

          <div className="relative">
            <button
              onClick={() => setExportOpen(!exportOpen)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Exportar
              {exportOpen ? (
                <ChevronUpIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              ) : (
                <ChevronDownIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              )}
            </button>
            {exportOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded shadow-lg z-10">
                <button
                  onClick={() => {
                    handleExportPDF();
                    setExportOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-xs sm:text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  PDF (50 eventos)
                </button>
                <button
                  onClick={() => {
                    handleExportCSV();
                    setExportOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-xs sm:text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  CSV (50 eventos)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabla desplegable */}
      {expanded && (
        <>
          {isLoading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Cargando auditoría...</p>
          ) : !events || events.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No hay eventos registrados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs sm:text-sm text-left border border-gray-100 dark:border-gray-700 rounded-lg">
                <thead className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                  <tr>
                    <th className="px-2 sm:px-4 py-2 border-b border-gray-200 dark:border-gray-600">Timestamp</th>
                    <th className="px-2 sm:px-4 py-2 border-b border-gray-200 dark:border-gray-600">Usuario</th>
                    <th className="px-2 sm:px-4 py-2 border-b border-gray-200 dark:border-gray-600">Entidad</th>
                    <th className="px-2 sm:px-4 py-2 border-b border-gray-200 dark:border-gray-600">Acción</th>
                    <th className="px-2 sm:px-4 py-2 border-b border-gray-200 dark:border-gray-600">Severidad</th>
                  </tr>
                </thead>
                <tbody>
                  {(events || []).slice(0, 10).map((entry: EventLogEntry) => (
                    <tr key={entry.id} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                      <td className="px-2 sm:px-4 py-2 border-b border-gray-100 dark:border-gray-700 whitespace-nowrap">
                        {moment(entry.timestamp).format("YYYY-MM-DD HH:mm:ss")}
                      </td>
                      <td className="px-2 sm:px-4 py-2 border-b border-gray-100 dark:border-gray-700 truncate max-w-[160px] md:max-w-[220px]">
                        {entry.actor}
                      </td>
                      <td className="px-2 sm:px-4 py-2 border-b border-gray-100 dark:border-gray-700 truncate max-w-[160px] md:max-w-[220px]">
                        {entry.entity}
                      </td>
                      <td className="px-2 sm:px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                        {actionBadge(entry.action)}
                      </td>
                      <td className="px-2 sm:px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                        {severityBadge(entry.severity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default AuditLog;
