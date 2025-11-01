import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPayment } from "../../api/payments"; // 👈 función API
import { Payment } from "../../types/payments";

interface Props {
  appointmentId: number;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function PaymentForm({ appointmentId, onClose, onSuccess }: Props) {
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    amount: "",
    method: "cash",
    status: "pending",
    reference_number: "",
    bank_name: "",
    received_by: "",
  });

  const mutation = useMutation({
    mutationFn: (data: any) => createPayment({ ...data, appointment: appointmentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      if (onSuccess) onSuccess();
      onClose();
    },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ width: "480px" }}>
        {/* Header */}
        <div className="flex-between mb-16">
          <h2>Registrar Pago</h2>
          <button type="button" className="btn btn-outline" onClick={onClose}>
            ✖
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex-col gap-16">
          {/* Monto */}
          <div>
            <label className="label">Monto:</label>
            <input
              type="number"
              step="0.01"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              required
              className="input"
            />
          </div>

          {/* Método */}
          <div>
            <label className="label">Método:</label>
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

          {/* Estado */}
          <div>
            <label className="label">Estado:</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="select"
            >
              <option value="pending">Pendiente</option>
              <option value="paid">Pagado</option>
              <option value="canceled">Cancelado</option>
              <option value="waived">Exonerado</option>
            </select>
          </div>

          {/* Campos condicionales */}
          {form.method === "transfer" && (
            <>
              <div>
                <label className="label">Número de referencia:</label>
                <input
                  type="text"
                  name="reference_number"
                  value={form.reference_number}
                  onChange={handleChange}
                  required
                  className="input"
                />
              </div>
              <div>
                <label className="label">Banco emisor:</label>
                <input
                  type="text"
                  name="bank_name"
                  value={form.bank_name}
                  onChange={handleChange}
                  required
                  className="input"
                />
              </div>
            </>
          )}

          {form.method === "card" && (
            <div>
              <label className="label">Número de comprobante:</label>
              <input
                type="text"
                name="reference_number"
                value={form.reference_number}
                onChange={handleChange}
                required
                className="input"
              />
            </div>
          )}

          {/* Recibido por */}
          <div>
            <label className="label">Recibido por:</label>
            <input
              type="text"
              name="received_by"
              value={form.received_by}
              onChange={handleChange}
              className="input"
            />
          </div>

          {/* Botones */}
          <div className="btn-row flex-between">
            <button type="button" onClick={onClose} className="btn btn-outline">
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
