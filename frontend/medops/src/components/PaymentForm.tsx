// src/components/PaymentForm.tsx
import { useState } from "react";
import { PaymentInput } from "../types/payments";

interface PaymentFormProps {
  onSubmit: (data: PaymentInput) => void;
}

export default function PaymentForm({ onSubmit }: PaymentFormProps) {
  const [form, setForm] = useState<PaymentInput>({
    appointment: 0, // 👈 placeholder, luego se seleccionará la cita real
    amount: "",
    method: "cash",
    status: "pending",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      <input
        className="input"
        type="number"
        name="amount"
        placeholder="Monto"
        value={form.amount}
        onChange={handleChange}
        required
      />

      <select
        className="select"
        name="method"
        value={form.method}
        onChange={handleChange}
      >
        <option value="cash">Efectivo</option>
        <option value="card">Tarjeta</option>
        <option value="transfer">Transferencia</option>
      </select>

      <select
        className="select"
        name="status"
        value={form.status}
        onChange={handleChange}
      >
        <option value="pending">Pendiente</option>
        <option value="paid">Pagado</option>
        <option value="canceled">Cancelado</option>
        <option value="waived">Exonerado</option>
      </select>

      <button className="btn btn-primary mt-3" type="submit">
        Guardar Pago
      </button>
    </form>
  );
}
