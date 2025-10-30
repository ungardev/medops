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

  if (isLoading) return <p>Cargando pagos...</p>;
  if (error) return <p className="text-danger">Error: {(error as Error).message}</p>;
  if (isEmpty) return <p>No tiene pagos registrados</p>;

  return (
    <>
      <p>
        <strong>Total pagado:</strong> {totalAmount}
      </p>
      <table className="table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Monto</th>
            <th>Método</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p: Payment) => (
            <tr key={p.id}>
              <td>
                {p.received_at
                  ? new Date(p.received_at).toLocaleDateString("es-VE")
                  : "—"}
              </td>
              <td>{p.amount}</td>
              <td>{p.method}</td>
              <td>{p.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
