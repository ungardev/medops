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

  // Totales por estado (usando estados reales del modelo)
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

      {/* Tabla simple */}
      <div className="table w-full text-sm">
        <div className="table-header grid grid-cols-5 gap-2 py-2 border-b">
          <div><strong>Monto</strong></div>
          <div><strong>Método</strong></div>
          <div><strong>Estatus</strong></div>
          <div><strong>Referencia</strong></div>
          <div><strong>Fecha</strong></div>
        </div>

        <div className="table-body">
          {payments.map((p) => {
            const amount = parseFloat(p.amount || "0");
            const dateStr = p.received_at ?? p.appointment_date; // fallback por si no llega received_at
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
              <div key={p.id} className="grid grid-cols-5 gap-2 py-2 border-b items-center">
                <div>${isNaN(amount) ? "0.00" : amount.toFixed(2)}</div>
                <div>{p.method}</div>
                <div><span className={`badge ${statusClass}`}>{statusLabel}</span></div>
                <div>{p.reference_number || "—"}</div>
                <div>{date}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
