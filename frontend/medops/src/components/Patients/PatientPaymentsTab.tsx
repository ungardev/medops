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

  if (isLoading) return <p className="text-sm text-gray-600 dark:text-gray-400">Cargando pagos...</p>;
  if (error) return <p className="text-sm text-red-600 dark:text-red-400">Error: {(error as Error).message}</p>;
  if (isEmpty) return <p className="text-sm text-gray-500 dark:text-gray-400">No tiene pagos registrados</p>;

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4 bg-white dark:bg-gray-900">
      <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">Pagos registrados</h3>

      <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-4">
        Total pagado: <span className="font-semibold">{totalAmount}</span>
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md">
          <thead className="bg-gray-100 dark:bg-gray-700 text-xs uppercase text-gray-600 dark:text-gray-300">
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
    </div>
  );
}
