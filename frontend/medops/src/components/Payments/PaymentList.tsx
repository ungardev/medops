import React from "react";
import { Payment, PaymentStatus, PaymentMethod } from "../../types/payments";

interface Props {
  payments: Payment[];
  hideSummaryBadges?: boolean; // 🔹 nueva prop
}

export default function PaymentList({ payments, hideSummaryBadges = false }: Props) {
  if (!payments || payments.length === 0) {
    return (
      <div className="text-sm text-[#0d2c53] dark:text-gray-400 italic">
        No hay pagos registrados para esta orden.
      </div>
    );
  }

  const totals = payments.reduce(
    (acc, p) => {
      const amt = parseFloat(p.amount || "0");
      acc.total += isNaN(amt) ? 0 : amt;

      switch (p.status) {
        case PaymentStatus.CONFIRMED:
          acc.confirmed += amt;
          break;
        case PaymentStatus.PENDING:
          acc.pending += amt;
          break;
        case PaymentStatus.REJECTED:
        case PaymentStatus.VOID:
          acc.failed += amt;
          break;
      }

      return acc;
    },
    { total: 0, confirmed: 0, pending: 0, failed: 0 }
  );

  return (
    <div className="space-y-4 mt-3">
      {/* 🔒 Solo mostrar resumen si no se pidió ocultarlo */}
      {!hideSummaryBadges && (
        <div className="flex flex-wrap gap-4 text-xs">
          <span className="inline-flex items-center rounded-md px-2 py-1 font-medium bg-gray-100 dark:bg-gray-800 text-[#0d2c53] dark:text-gray-100">
            <strong>Total pagos:</strong> ${totals.total.toFixed(2)}
          </span>
          <span className="inline-flex items-center rounded-md px-2 py-1 font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200">
            <strong>Confirmados:</strong> ${totals.confirmed.toFixed(2)}
          </span>
          <span className="inline-flex items-center rounded-md px-2 py-1 font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-200">
            <strong>Pendientes:</strong> ${totals.pending.toFixed(2)}
          </span>
          <span className="inline-flex items-center rounded-md px-2 py-1 font-medium bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200">
            <strong>Rechazados/Anulados:</strong> ${totals.failed.toFixed(2)}
          </span>
        </div>
      )}

      {/* Tabla real */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-x-auto">
        <table className="w-full text-sm text-left text-[#0d2c53] dark:text-gray-100">
          <thead className="bg-gray-100 dark:bg-gray-700 text-xs uppercase text-[#0d2c53] dark:text-gray-300">
            <tr>
              <th className="px-2 py-1 border-b">Monto</th>
              <th className="px-2 py-1 border-b">Método</th>
              <th className="px-2 py-1 border-b">Estatus</th>
              <th className="px-2 py-1 border-b">Referencia</th>
              <th className="px-2 py-1 border-b">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => {
              const amount = parseFloat(p.amount || "0");
              const dateStr = p.received_at ?? p.appointment_date;
              const date = dateStr ? new Date(dateStr).toLocaleDateString() : "—";

              let statusLabel = "";
              let statusClass = "";

              switch (p.status) {
                case PaymentStatus.CONFIRMED:
                  statusLabel = "Confirmado";
                  statusClass =
                    "bg-green-100 text-green-800 ring-green-200 dark:bg-green-800 dark:text-green-200";
                  break;
                case PaymentStatus.PENDING:
                  statusLabel = "Pendiente";
                  statusClass =
                    "bg-yellow-100 text-yellow-800 ring-yellow-200 dark:bg-yellow-700 dark:text-yellow-200";
                  break;
                case PaymentStatus.REJECTED:
                  statusLabel = "Rechazado";
                  statusClass =
                    "bg-red-100 text-red-800 ring-red-200 dark:bg-red-800 dark:text-red-200";
                  break;
                case PaymentStatus.VOID:
                  statusLabel = "Anulado";
                  statusClass =
                    "bg-gray-100 text-[#0d2c53] ring-gray-200 dark:bg-gray-700 dark:text-gray-200";
                  break;
              }

              return (
                <tr key={p.id} className="border-t border-gray-200 dark:border-gray-700">
                  <td className="px-2 py-1">${isNaN(amount) ? "0.00" : amount.toFixed(2)}</td>
                  <td className="px-2 py-1">
                    {p.method === PaymentMethod.CASH
                      ? "Efectivo"
                      : p.method === PaymentMethod.CARD
                      ? "Tarjeta"
                      : p.method === PaymentMethod.TRANSFER
                      ? "Transferencia"
                      : "Otro"}
                  </td>
                  <td className="px-2 py-1">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusClass}`}
                    >
                      {statusLabel}
                    </span>
                  </td>
                  <td className="px-2 py-1">{p.reference_number || "—"}</td>
                  <td className="px-2 py-1">{date}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
