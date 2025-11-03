import { useState } from "react";
import { usePayments, useCreatePayment } from "../../hooks/consultations/usePayments";

interface PaymentsPanelProps {
  appointmentId: number;
}

export default function PaymentsPanel({ appointmentId }: PaymentsPanelProps) {
  const { data: payments, isLoading } = usePayments(appointmentId);
  const createPayment = useCreatePayment(appointmentId);

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");
  const [reference, setReference] = useState("");

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    createPayment.mutate({
      appointment: appointmentId,
      amount: parseFloat(amount),
      method,
      reference_number: reference || null,
    });
    setAmount("");
    setMethod("cash");
    setReference("");
  };

  return (
    <div className="payments-panel card">
      <h3 className="text-lg font-bold mb-2">Pagos</h3>

      {isLoading && <p className="text-muted">Cargando pagos...</p>}

      <ul className="mb-4">
        {payments?.length === 0 && <li className="text-muted">Sin pagos registrados</li>}
        {payments?.map((p) => {
          const amountNum = Number(p.amount) || 0;
          return (
            <li key={p.id} className="border-b py-1">
              <strong>${amountNum.toFixed(2)}</strong> — {p.method}
              <span className="text-sm text-muted">
                {" "}
                {p.status} {p.reference_number && `| Ref: ${p.reference_number}`}
              </span>
            </li>
          );
        })}
      </ul>

      <form onSubmit={handleAddPayment} className="flex flex-col gap-3">
        <input
          type="number"
          step="0.01"
          placeholder="Monto"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="input"
        />

        {/* Select estilizado */}
        <div className="select-wrapper">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="select"
          >
            <option value="cash">Efectivo</option>
            <option value="card">Tarjeta</option>
            <option value="transfer">Transferencia</option>
            <option value="other">Otro</option>
          </select>
        </div>

        <input
          type="text"
          placeholder="Referencia (opcional)"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          className="input"
        />

        <button type="submit" className="btn-primary self-start">
          + Registrar pago
        </button>
      </form>
    </div>
  );
}
