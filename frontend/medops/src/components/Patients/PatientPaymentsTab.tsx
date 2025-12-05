// src/components/Patients/PatientPaymentsTab.tsx
import React from "react";
import { PatientTabProps } from "./types";
import { usePaymentsByPatient } from "../../hooks/patients/usePaymentsByPatient";
import { Payment } from "../../types/payments";

export default function PatientPaymentsTab({ patient }: PatientTabProps) {
  const { data, isLoading, error } = usePaymentsByPatient(patient.id);

  const payments = data?.list ?? [];
  const totalAmount = data?.totalAmount ?? 0;
  const isEmpty = !isLoading && !error && payments.length === 0;

  if (isLoading)
    return <p className="text-xs sm:text-sm text-[#0d2c53] dark:text-gray-400">Cargando pagos...</p>;
  if (error)
    return <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">Error: {(error as Error).message}</p>;
  if (isEmpty)
    return <p className="text-xs sm:text-sm text-[#0d2c53] dark:text-gray-400">No tiene pagos registrados</p>;

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-3 sm:p-4 bg-white dark:bg-gray-900">
      <h3 className="text-sm sm:text-base font-semibold text-[#0d2c53] dark:text-gray-100 mb-3 sm:mb-4">
        Pagos registrados
      </h3>

      <p className="text-xs sm:text-sm font-medium text-[#0d2c53] dark:text-blue-400 mb-3 sm:mb-4">
        Total pagado: <span className="font-semibold">{totalAmount}</span>
      </p>

      {/* 🔹 Vista desktop: tabla (intocable) */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm text-left text-[#0d2c53] dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md">
          <thead className="bg-gray-100 dark:bg-gray-700 text-xs uppercase text-[#0d2c53] dark:text-gray-300">
            <tr>
              <th className="px-4 py-2 border-b">Fecha</th>
              <th className="px-4 py-2 border-b">Monto</th>
              <th className="px-4 py-2 border-b">Método</th>
              <th className="px-4 py-2 border-b">Estado</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p: Payment) => (
              <tr key={p.id} className="border-b border-gray-200 dark:border-gray-700">
                <td className="px-4 py-2">
                  {p.received_at
                    ? new Date(p.received_at).toLocaleDateString("es-VE")
                    : "—"}
                </td>
                <td className="px-4 py-2">{p.amount}</td>
                <td className="px-4 py-2">{p.method}</td>
                <td className="px-4 py-2">{p.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 🔹 Vista mobile: tarjetas mejoradas */}
      <div className="sm:hidden space-y-3">
        {payments.map((p: Payment) => (
          <div
            key={p.id}
            className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-3 shadow-sm"
          >
            <p className="text-sm font-semibold text-[#0d2c53] dark:text-gray-100 mb-2">
              Pago #{p.id}
            </p>
            <div className="text-xs text-[#0d2c53] dark:text-gray-300 space-y-1">
              <div>
                <strong>Fecha:</strong>{" "}
                {p.received_at ? new Date(p.received_at).toLocaleDateString("es-VE") : "—"}
              </div>
              <div>
                <strong>Monto:</strong> {p.amount}
              </div>
              <div>
                <strong>Método:</strong> {p.method}
              </div>
              <div>
                <strong>Estado:</strong> {p.status}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
