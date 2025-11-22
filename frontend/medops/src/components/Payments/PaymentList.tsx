// src/components/Payments/PaymentList.tsx
import React from "react";
import { Payment } from "../../types/payments";

interface Props {
  payments: Payment[];
}

export default function PaymentList({ payments }: Props) {
  if (!payments || payments.length === 0) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 italic">
        No hay pagos registrados para esta orden.
      </div>
    );
  }

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
    <div className="space-y-4 mt-3">
      {/* Resumen compacto */}
      <div className="flex flex-wrap gap-4 text-xs">
        <span className="inline-flex items-center rounded-md px-2 py-1 font-medium bg-gray-100 dark:bg-gray-800">
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

      {/* Tabla real */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-800 dark:text-gray-100">
          <thead className="bg-gray-100 dark:bg-gray-700 text-xs uppercase text-gray-600 dark:text-gray-300">
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
                  ? "bg-green-100 text-green-800 ring-green-200 dark:bg-green-800 dark:text-green-200"
                  : p.status === "pending"
                  ? "bg-yellow-100 text-yellow-800 ring-yellow-200 dark:bg-yellow-700 dark:text-yellow-200"
                  : p.status === "rejected"
                  ? "bg-red-100 text-red-800 ring-red-200 dark:bg-red-800 dark:text-red-200"
                  : p.status === "void"
                  ? "bg-gray-100 text-gray-800 ring-gray-200 dark:bg-gray-700 dark:text-gray-200"
                  : "bg-gray-100 text-gray-800 ring-gray-200 dark:bg-gray-700 dark:text-gray-200";

              return (
                <tr key={p.id} className="border-t border-gray-200 dark:border-gray-700">
                  <td className="px-2 py-1">${isNaN(amount) ? "0.00" : amount.toFixed(2)}</td>
                  <td className="px-2 py-1">{p.method}</td>
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
