import { useState } from "react";
import {
  useChargeOrder,
  useCreatePayment,
  PaymentPayload,
} from "../../hooks/consultations/useChargeOrder";

interface PaymentsPanelProps {
  appointmentId: number;
}

export default function PaymentsPanel({ appointmentId }: PaymentsPanelProps) {
  const { data: order, isLoading } = useChargeOrder(appointmentId);
  const createPayment = useCreatePayment(order?.id, appointmentId);

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");
  const [reference, setReference] = useState("");

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !order) return;

    const payload: PaymentPayload = {
      charge_order: order.id,
      amount: parseFloat(amount),
      method,
      reference_number: reference || null,
    };

    createPayment.mutate(payload, {
      onSuccess: () => {
        setAmount("");
        setMethod("cash");
        setReference("");
      },
    });
  };

  if (isLoading) return <p className="text-muted">Cargando orden...</p>;
  if (!order) return <p className="text-muted">No hay orden asociada</p>;

  return (
    <div className="payments-panel card">
      <h3 className="text-lg font-bold mb-2">Pagos</h3>

      <div className="mb-3 text-sm">
        <p>
          <strong>Total:</strong> ${order.total.toFixed(2)}
        </p>
        <p>
          <strong>Saldo pendiente:</strong> ${order.balance_due.toFixed(2)}
        </p>
        <p>
          <strong>Estado:</strong>{" "}
          <span className={`status-badge status-${order.status}`}>
            {order.status}
          </span>
        </p>
      </div>

      <ul className="mb-4">
        {order.payments?.length === 0 && (
          <li className="text-muted">Sin pagos registrados</li>
        )}
        {order.payments?.map((p) => (
          <li key={p.id} className="border-b py-1">
            <strong>${Number(p.amount).toFixed(2)}</strong> — {p.method}
            <span className="text-sm text-muted">
              {" "}
              {p.status}
              {p.reference_number && ` | Ref: ${p.reference_number}`}
            </span>
          </li>
        ))}
      </ul>

      <form onSubmit={handleAddPayment} className="flex flex-col gap-3">
        <input
          type="number"
          step="0.01"
          placeholder="Monto"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="input"
          required
        />

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

        <button
          type="submit"
          className="btn-primary self-start"
          disabled={createPayment.isPending}
        >
          {createPayment.isPending ? "Registrando..." : "+ Registrar pago"}
        </button>

        {createPayment.isError && (
          <p className="text-red-500 text-sm">
            Error al registrar el pago. Intente de nuevo.
          </p>
        )}
      </form>
    </div>
  );
}
