import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { PaymentInput, Payment } from "../../types/payments";

interface Props {
  orderId: number;
  onClose: () => void;
}

export default function RegisterPaymentModal({ orderId, onClose }: Props) {
  const queryClient = useQueryClient();

  const [form, setForm] = useState<PaymentInput>({
    appointment: orderId,
    amount: "",
    method: "cash",
    status: "pending",
    reference_number: "",
    bank_name: "",
  });

  const mutation = useMutation<Payment, Error, PaymentInput>({
    mutationFn: async (data: PaymentInput) => {
      const res = await axios.post("/payments/", data);
      return res.data as Payment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["charge-orders"] });
      onClose();
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Registrar nuevo pago</h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label>Monto</label>
            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              className="input"
              required
            />
          </div>

          <div>
            <label>Método</label>
            <select
              name="method"
              value={form.method}
              onChange={handleChange}
              className="select"
            >
              <option value="cash">Efectivo</option>
              <option value="card">Tarjeta</option>
              <option value="transfer">Transferencia</option>
            </select>
          </div>

          <div>
            <label>Estado</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="select"
            >
              <option value="pending">Pendiente</option>
              <option value="paid">Pagado</option>
              <option value="canceled">Cancelado</option>
              <option value="waived">Condonado</option>
            </select>
          </div>

          <div>
            <label>Referencia</label>
            <input
              type="text"
              name="reference_number"
              value={form.reference_number}
              onChange={handleChange}
              className="input"
            />
          </div>

          <div>
            <label>Banco</label>
            <input
              type="text"
              name="bank_name"
              value={form.bank_name}
              onChange={handleChange}
              className="input"
            />
          </div>

          <div className="flex justify-between mt-4">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? "Guardando..." : "Registrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
