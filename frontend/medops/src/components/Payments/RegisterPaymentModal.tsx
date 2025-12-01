// src/components/Payments/RegisterPaymentModal.tsx
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { PaymentInput, Payment, PaymentMethod, PaymentStatus } from "../../types/payments";

interface Props {
  appointmentId: number;
  chargeOrderId: number;
  onClose: () => void;
}

export default function RegisterPaymentModal({ appointmentId, chargeOrderId, onClose }: Props) {
  const queryClient = useQueryClient();

  const [form, setForm] = useState<Omit<PaymentInput, "status">>({
    charge_order: chargeOrderId,
    appointment: appointmentId,
    amount: "",
    method: PaymentMethod.CASH,
    reference_number: "",
    bank_name: "",
  });

  const mutation = useMutation<Payment, Error, PaymentInput>({
    mutationFn: async (data) => {
      const res = await axios.post(
        `http://127.0.0.1/api/charge-orders/${chargeOrderId}/payments/`,
        {
          ...data,
          status: PaymentStatus.CONFIRMED,
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
    setForm((prev) => ({
      ...prev,
      [name]: name === "method" ? (value as PaymentMethod) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form as PaymentInput);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-2 sm:px-0">
      <div className="max-w-md w-full rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-[#0d2c53] dark:text-gray-100 mb-3 sm:mb-4">
          Registrar nuevo pago
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-[#0d2c53] dark:text-gray-300 mb-1">
              Monto
            </label>
            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              required
              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-md text-xs sm:text-sm 
                         bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100 
                         focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-[#0d2c53] dark:text-gray-300 mb-1">
              Método
            </label>
            <select
              name="method"
              value={form.method}
              onChange={handleChange}
              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-md text-xs sm:text-sm 
                         bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100 
                         focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
            >
              <option value={PaymentMethod.CASH}>Efectivo</option>
              <option value={PaymentMethod.CARD}>Tarjeta</option>
              <option value={PaymentMethod.TRANSFER}>Transferencia</option>
              <option value={PaymentMethod.OTHER}>Otro</option>
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-[#0d2c53] dark:text-gray-300 mb-1">
              Referencia
            </label>
            <input
              type="text"
              name="reference_number"
              value={form.reference_number}
              onChange={handleChange}
              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-md text-xs sm:text-sm 
                         bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100 
                         focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-[#0d2c53] dark:text-gray-300 mb-1">
              Banco
            </label>
            <input
              type="text"
              name="bank_name"
              value={form.bank_name}
              onChange={handleChange}
              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-md text-xs sm:text-sm 
                         bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100 
                         focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
            />
          </div>

          {/* Botones verticales */}
          <div className="flex flex-col gap-2 mt-3 sm:mt-4">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full px-3 py-1.5 rounded-md bg-[#0d2c53] text-white hover:bg-[#0b2444] transition text-xs sm:text-sm"
            >
              {mutation.isPending ? "Guardando..." : "Registrar"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 
                         bg-gray-100 dark:bg-gray-700 text-[#0d2c53] dark:text-gray-200 
                         hover:bg-gray-200 dark:hover:bg-gray-600 transition text-xs sm:text-sm"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
