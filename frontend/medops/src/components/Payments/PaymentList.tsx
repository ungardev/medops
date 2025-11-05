import React from "react";
import { Payment } from "../../types/payments";

interface Props {
  payments: Payment[];
}

export default function PaymentList({ payments }: Props) {
  if (!payments || payments.length === 0) {
    return (
      <div className="text-muted text-sm">
        No hay pagos registrados para esta orden.
      </div>
    );
  }

  // Totales por estado
  const totals = payments.reduce(
    (acc, p) => {
      const amt = parseFloat(p.amount || "0");
      acc.total += isNaN(amt) ? 0 : amt;

      if (p.status === "confirmed") acc.confirmed += amt;
      if (p.status === "pending") acc.pending += amt;
      if (p.status === "rejected" || p.status === "void") acc.failed += amt;

      return acc;
    },
    { total: 0, confirmed: 0, pending: 0, failed: 0 }
  );

  return (
    <div className="payment-list mt-3">
      {/* Resumen compacto */}
      <div className="flex gap-6 mb-2 text-xs">
        <span><strong>Total pagos:</strong> ${totals.total.toFixed(2)}</span>
        <span className="text-success"><strong>Confirmados:</strong> ${totals.confirmed.toFixed(2)}</span>
        <span className="text-warning"><strong>Pendientes:</strong> ${totals.pending.toFixed(2)}</span>
        <span className="text-danger"><strong>Rechazados/Anulados:</strong> ${totals.failed.toFixed(2)}</span>
      </div>

      {/* Tabla real */}
      <table className="table-auto w-full text-sm border">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-2 py-1 text-left">Monto</th>
            <th className="px-2 py-1 text-left">Método</th>
            <th className="px-2 py-1 text-left">Estatus</th>
            <th className="px-2 py-1 text-left">Referencia</th>
            <th className="px-2 py-1 text-left">Fecha</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => {
            const amount = parseFloat(p.amount || "0");
            const dateStr = p.received_at ?? p.appointment_date;
            const date = dateStr ? new Date(dateStr).toLocaleDateString() : "—";

            const statusLabel =
              p.status === "confirmed"
                ? "Confirmado"
                : p.status === "pending"
                ? "Pendiente"
                : p.status === "rejected"
                ? "Rechazado"
                : p.status === "void"
                ? "Anulado"
                : p.status;

            const statusClass =
              p.status === "confirmed"
                ? "badge-success"
                : p.status === "pending"
                ? "badge-warning"
                : p.status === "rejected"
                ? "badge-danger"
                : p.status === "void"
                ? "badge-muted"
                : "badge-muted";

            return (
              <tr key={p.id} className="border-t">
                <td className="px-2 py-1">${isNaN(amount) ? "0.00" : amount.toFixed(2)}</td>
                <td className="px-2 py-1">{p.method}</td>
                <td className="px-2 py-1">
                  <span className={`badge ${statusClass}`}>{statusLabel}</span>
                </td>
                <td className="px-2 py-1">{p.reference_number || "—"}</td>
                <td className="px-2 py-1">{date}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
