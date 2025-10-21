import { useState } from "react";
import { Payment, PaymentInput } from "../types/payments";

interface Props {
  onSubmit: (data: PaymentInput) => void;
  payment?: Payment | null;
}

export default function PaymentForm({ onSubmit, payment }: Props) {
  const [form, setForm] = useState<PaymentInput>({
    patient: payment?.patient || "",
    amount: payment?.amount || 0,
    method: payment?.method || "cash",
    date: payment?.date || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: name === "amount" ? Number(value) : value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="patient"
        value={form.patient}
        onChange={handleChange}
        placeholder="Paciente"
      />
      <input
        type="number"
        name="amount"
        value={form.amount}
        onChange={handleChange}
        placeholder="Monto"
      />
      <select name="method" value={form.method} onChange={handleChange}>
        <option value="cash">Efectivo</option>
        <option value="card">Tarjeta</option>
        <option value="transfer">Transferencia</option>
      </select>
      <input
        type="date"
        name="date"
        value={form.date}
        onChange={handleChange}
      />
      <button type="submit">Guardar</button>
    </form>
  );
}
