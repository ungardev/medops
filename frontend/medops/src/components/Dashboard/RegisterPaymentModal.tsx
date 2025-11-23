import { useState } from "react";
import { createPayment } from "@/api/payments";
import { PaymentMethod, PaymentStatus } from "@/types/payments";
import { useInvalidatePayments } from "@/hooks/payments/useInvalidatePayments";
import { useInvalidateChargeOrders } from "@/hooks/payments/useInvalidateChargeOrders";
import { useQueryClient } from "@tanstack/react-query";

export interface RegisterPaymentModalProps {
  chargeOrderId: number;
  appointmentId?: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RegisterPaymentModal({
  chargeOrderId,
  appointmentId,
  onClose,
  onSuccess,
}: RegisterPaymentModalProps) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [status, setStatus] = useState<PaymentStatus>("confirmed");
  const [reference, setReference] = useState("");
  const [bankName, setBankName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const invalidatePayments = useInvalidatePayments();
  const invalidateChargeOrders = useInvalidateChargeOrders();
  const queryClient = useQueryClient(); // 🔹 acceso al cache global

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const newPayment = await createPayment({
        amount,
        method,
        status,
        reference_number: reference || undefined,
        bank_name: bankName || undefined,
        charge_order: chargeOrderId,
        appointment: appointmentId,
      });

      // 🔹 Invalidar queries relacionadas
      invalidatePayments(newPayment.id);
      invalidateChargeOrders(chargeOrderId);
      queryClient.invalidateQueries({ queryKey: ["notifications"] }); // ⚔️ refresca el feed

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Error registrando pago", err);
      setError("No se pudo registrar el pago. Verifica el endpoint y los datos.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Registrar Pago</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && <p className="text-danger text-sm">{error}</p>}

          <div>
            <label className="text-sm font-semibold">Monto</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input"
              required
            />
          </div>

          <div>
            <label className="text-sm font-semibold">Método</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              className="select"
            >
              <option value="cash">Efectivo</option>
              <option value="transfer">Transferencia</option>
              <option value="card">Tarjeta</option>
              <option value="other">Otro</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold">Estado</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as PaymentStatus)}
              className="select"
            >
              <option value="confirmed">Confirmado</option>
              <option value="pending">Pendiente</option>
              <option value="rejected">Rechazado</option>
              <option value="void">Anulado</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold">Referencia</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="input"
              placeholder="N° de transferencia / voucher"
            />
          </div>

          <div>
            <label className="text-sm font-semibold">Banco</label>
            <input
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="input"
              placeholder="Nombre del banco"
            />
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? "Registrando..." : "Registrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
