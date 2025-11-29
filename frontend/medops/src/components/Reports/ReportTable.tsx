import React from "react";
import { ReportRow, ReportStatus, ReportType } from "@/types/reports";

interface Props {
  data: ReportRow[];
}

export default function ReportTable({ data }: Props) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-x-auto">
      <table className="w-full text-sm text-left text-[#0d2c53] dark:text-gray-100">
        <thead className="bg-gray-50 dark:bg-gray-700 text-sm font-semibold text-[#0d2c53] dark:text-gray-200">
          <tr>
            <th className="px-4 py-2 border-b">Fecha</th>
            <th className="px-4 py-2 border-b">Tipo</th>
            <th className="px-4 py-2 border-b">Entidad</th>
            <th className="px-4 py-2 border-b">Estado</th>
            <th className="px-4 py-2 border-b text-right">Monto</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                className="px-4 py-6 text-center text-sm text-[#0d2c53] dark:text-gray-400 italic"
              >
                No hay resultados para los filtros seleccionados
              </td>
            </tr>
          ) : (
            data.map((row) => {
              let statusLabel = "";
              let statusClass = "";

              switch (row.status) {
                case ReportStatus.CONFIRMED:
                  statusLabel = "Confirmado";
                  statusClass =
                    "bg-green-100 text-green-800 ring-green-200 dark:bg-green-800 dark:text-green-200";
                  break;
                case ReportStatus.PENDING:
                  statusLabel = "Pendiente";
                  statusClass =
                    "bg-yellow-100 text-yellow-800 ring-yellow-200 dark:bg-yellow-700 dark:text-yellow-200";
                  break;
                case ReportStatus.CANCELLED:
                  statusLabel = "Cancelado";
                  statusClass =
                    "bg-red-100 text-red-800 ring-red-200 dark:bg-red-800 dark:text-red-200";
                  break;
                case ReportStatus.COMPLETED:
                case ReportStatus.FINALIZED:
                  statusLabel = "Completado";
                  statusClass =
                    "bg-gray-100 text-[#0d2c53] ring-gray-200 dark:bg-gray-700 dark:text-gray-200";
                  break;
              }

              return (
                <tr key={row.id} className="border-b border-gray-200 dark:border-gray-700">
                  <td className="px-4 py-2">{row.date}</td>
                  <td className="px-4 py-2">
                    <span
                      className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset 
                                 bg-gray-100 text-[#0d2c53] dark:bg-gray-700 dark:text-gray-200"
                    >
                      {row.type === ReportType.FINANCIAL
                        ? "Financiero"
                        : row.type === ReportType.CLINICAL
                        ? "Clínico"
                        : "Combinado"}
                    </span>
                  </td>
                  <td className="px-4 py-2">{row.entity}</td>
                  <td className="px-4 py-2">
                    {statusLabel && (
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusClass}`}
                      >
                        {statusLabel}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {row.amount.toLocaleString("es-VE", {
                      style: "currency",
                      currency: "USD",
                    })}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
