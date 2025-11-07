// src/components/Reports/ReportTable.tsx
import React from "react";
import { ReportRow } from "@/types/reports";

interface Props {
  data: ReportRow[];
}

export default function ReportTable({ data }: Props) {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Tipo</th>
          <th>Entidad</th>
          <th>Estado</th>
          <th>Monto</th>
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr>
            <td colSpan={5} className="text-muted">
              No hay resultados para los filtros seleccionados
            </td>
          </tr>
        ) : (
          data.map((row) => (
            <tr key={row.id}>
              <td>{row.date}</td>
              <td>{row.type}</td>
              <td>{row.entity}</td>
              <td>{row.status}</td>
              <td>
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
