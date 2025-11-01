import React from "react";
import { Payment } from "../../types/payments";

interface Props {
  expectedAmount: number | string;   // monto esperado de la cita
  payments: Payment[];               // lista de pagos asociados
}

export default function PaymentSummary({ expectedAmount, payments }: Props) {
  // Normalizar monto esperado
  const expected = typeof expectedAmount === "string" ? parseFloat(expectedAmount) : expectedAmount;

  // Calcular total pagado (solo pagos con estado "paid")
  const totalPaid = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);

  // Calcular saldo pendiente
  const balance = expected - totalPaid;

  // Determinar estado visual
  let statusLabel = "Pendiente";
  let statusClass = "text-warning";
  if (balance <= 0) {
    statusLabel = "Saldado";
    statusClass = "text-success";
  } else if (totalPaid > 0 && balance > 0) {
    statusLabel = "Parcial";
    statusClass = "text-info";
  }

  return (
    <div className="card mb-4 p-4">
      <h3 className="text-lg font-semibold mb-2">Resumen de Pagos</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-gray-500">Monto esperado</p>
          <p className="font-bold">{expected.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Total pagado</p>
          <p className="font-bold text-success">{totalPaid.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Saldo pendiente</p>
          <p className={`font-bold ${statusClass}`}>
            {balance > 0 ? balance.toFixed(2) : "0.00"} ({statusLabel})
          </p>
        </div>
      </div>
    </div>
  );
}
