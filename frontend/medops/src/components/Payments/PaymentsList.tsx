import React from "react";
import { Payment } from "types/payments";

interface PaymentsListProps {
  payments: Payment[];
  onEdit: (payment: Payment) => void;
  onDelete: (id: number) => void;
}

function formatCurrency(value: string, currency: string = "USD") {
  const num = Number(value);
  if (isNaN(num)) return value; // fallback si no es número
  return new Intl.NumberFormat("es-VE", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(num);
}

export default function PaymentsList({ payments, onEdit, onDelete }: PaymentsListProps) {
  return (
    <div>
      <h2>Lista de Pagos</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Cita</th>
            <th>Paciente</th>
            <th>Monto</th>
            <th>Método</th>
            <th>Estado</th>
            <th>Referencia</th>
            <th>Banco</th>
            <th>Recibido por</th>
            <th>Fecha</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.appointment}</td>
              <td>{p.patient?.full_name || "—"}</td> {/* ✅ corregido */}
              <td>{formatCurrency(p.amount, "USD")}</td>
              <td>{p.method}</td>
              <td>{p.status}</td>
              <td>{p.reference_number || "—"}</td>
              <td>{p.bank_name || "—"}</td>
              <td>{p.received_by || "—"}</td>
              <td>
                {p.received_at
                  ? new Date(p.received_at).toLocaleString("es-VE")
                  : "—"}
              </td>
              <td>
                <button onClick={() => onEdit(p)}>✏️ Editar</button>
                <button onClick={() => onDelete(p.id)}>🗑 Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
