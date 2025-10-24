import { useState } from "react";
import { Payment, PaymentInput } from "../types/payments";

interface Props {
  onSubmit: (data: PaymentInput) => void;
  payment?: Payment | null;
  appointmentId?: number; // 👈 opcional: si ya sabes la cita
}

export default function PaymentForm({ onSubmit, payment, appointmentId }: Props) {
  const [form, setForm] = useState<PaymentInput>({
    appointment: payment?.appointment || appointmentId || 0, // 👈 referencia a la cita
    amount: payment?.amount || "",
    method: payment?.method || "cash",
    status: payment?.status || "pending",
    reference_number: payment?.reference_number || "",
    bank_name: payment?.bank_name || "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Monto */}
      <input
        type="number"
        name="amount"
        value={form.amount}
        onChange={handleChange}
        placeholder="Monto"
        required
      />

      {/* Método */}
      <select name="method" value={form.method} onChange={handleChange}>
        <option value="cash">Efectivo</option>
        <option value="card">Tarjeta</option>
        <option value="transfer">Transferencia</option>
      </select>

      {/* Estado */}
      <select name="status" value={form.status} onChange={handleChange}>
        <option value="pending">Pendiente</option>
        <option value="paid">Pagado</option>
        <option value="waived">Exonerado</option>
      </select>

      {/* Referencia */}
      <input
        type="text"
        name="reference_number"
        value={form.reference_number}
        onChange={handleChange}
        placeholder="Número de referencia"
      />

      {/* Banco */}
      <input
        type="text"
        name="bank_name"
        value={form.bank_name}
        onChange={handleChange}
        placeholder="Banco"
      />

      <button type="submit">Guardar</button>
    </form>
  );
}
