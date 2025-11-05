import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { PaymentInput, Payment } from "../../types/payments";

interface Props {
  appointmentId: number;
  chargeOrderId: number;
  onClose: () => void;
}

export default function RegisterPaymentModal({ appointmentId, chargeOrderId, onClose }: Props) {
  const queryClient = useQueryClient();

  const [form, setForm] = useState<Omit<PaymentInput, "status">>({
    amount: "",
    method: "cash",
    reference_number: "",
    bank_name: "",
  });

  const mutation = useMutation<Payment, Error, PaymentInput>({
    mutationFn: async (data) => {
      const res = await axios.post(
        `http://127.0.0.1/api/charge-orders/${chargeOrderId}/payments/`,
        {
          ...data,
          status: "confirmed", // 👈 siempre confirmado
        }
      );
      return res.data as Payment;
    },
    onSuccess: () => {
      // Refresca lista, detalle y eventos
      queryClient.invalidateQueries({ queryKey: ["charge-orders"] });
      queryClient.invalidateQueries({ queryKey: ["charge-order", String(chargeOrderId)] });
      queryClient.invalidateQueries({ queryKey: ["charge-order-events", String(chargeOrderId)] });
      onClose();
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form as PaymentInput);
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
              <option value="other">Otro</option>
            </select>
          </div>

          {/* 👇 Eliminamos el selector de estado, ya no se expone al usuario */}

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
