// src/components/Reports/ReportTable.tsx
import React from "react";
import { ReportRow } from "@/types/reports";

interface Props {
  data: ReportRow[];
}

export default function ReportTable({ data }: Props) {
  return (
    <table className="table reports-table">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Tipo</th>
          <th>Entidad</th>
          <th>Estado</th>
          <th className="text-right">Monto</th>
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr>
            <td colSpan={5} className="text-muted text-center">
              No hay resultados para los filtros seleccionados
            </td>
          </tr>
        ) : (
          data.map((row) => (
            <tr key={row.id}>
              <td>{row.date}</td>
              <td>
                <span className="badge badge-muted">{row.type}</span>
              </td>
              <td>{row.entity}</td>
              <td>
                {row.status === "confirmed" && (
                  <span className="badge badge-success">Confirmado</span>
                )}
                {row.status === "pending" && (
                  <span className="badge badge-warning">Pendiente</span>
                )}
                {row.status === "cancelled" && (
                  <span className="badge badge-danger">Cancelado</span>
                )}
                {["completed", "finalized"].includes(row.status) && (
                  <span className="badge badge-muted">Completado</span>
                )}
              </td>
              <td className="text-right">
                {row.amount.toLocaleString("es-VE", {
                  style: "currency",
                  currency: "USD",
                })}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
