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

  // 👇 Incluimos charge_order y appointment en el estado inicial
  const [form, setForm] = useState<Omit<PaymentInput, "status">>({
    charge_order: chargeOrderId,
    appointment: appointmentId,
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="max-w-md w-full rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Registrar nuevo pago
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monto</label>
            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                         bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 
                         focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Método</label>
            <select
              name="method"
              value={form.method}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                         bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 
                         focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="cash">Efectivo</option>
              <option value="card">Tarjeta</option>
              <option value="transfer">Transferencia</option>
              <option value="other">Otro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Referencia</label>
            <input
              type="text"
              name="reference_number"
              value={form.reference_number}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                         bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 
                         focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Banco</label>
            <input
              type="text"
              name="bank_name"
              value={form.bank_name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                         bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 
                         focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="flex justify-between mt-6">
            <button
              type="button"
              className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 
                         bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 
                         hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition text-sm"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Guardando..." : "Registrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
