import { useState } from "react";
import { Payment } from "../../types/payments";
import PaymentReceiptModal from "./PaymentReceiptModal";

interface Props {
  payments?: Payment[]; // ahora opcional
}

export default function PaymentList({ payments = [] }: Props) {
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const handleConfirm = (id: number) => {
    console.log("Confirmar pago", id);
    // TODO: llamada API para marcar como pagado
  };

  const handleCancel = (id: number) => {
    console.log("Cancelar pago", id);
    // TODO: llamada API para anular pago
  };

  const handleViewReceipt = (payment: Payment) => {
    setSelectedPayment(payment);
  };

  return (
    <>
      <table className="table mt-4">
        <thead>
          <tr>
            <th>Monto</th>
            <th>Método</th>
            <th>Estado</th>
            <th>Referencia</th>
            <th>Banco</th>
            <th>Recibido por</th>
            <th>Fecha</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {payments.length === 0 ? (
            <tr>
              <td colSpan={8} className="text-center text-muted py-4">
                No hay pagos registrados
              </td>
            </tr>
          ) : (
            payments.map((p) => (
              <tr key={p.id}>
                <td>
                  $
                  {p.amount
                    ? parseFloat(p.amount).toFixed(2)
                    : "0.00"}
                </td>
                <td>{p.method}</td>
                <td>
                  <span
                    className={`badge ${
                      p.status === "paid"
                        ? "badge-success"
                        : p.status === "pending"
                        ? "badge-warning"
                        : p.status === "canceled"
                        ? "badge-danger"
                        : "badge-muted"
                    }`}
                  >
                    {p.status}
                  </span>
                </td>
                <td>{p.reference_number || "—"}</td>
                <td>{p.bank_name || "—"}</td>
                <td>{p.received_by || "—"}</td>
                <td>
                  {p.received_at
                    ? new Date(p.received_at + "T00:00:00").toLocaleString()
                    : p.appointment_date
                    ? new Date(p.appointment_date + "T00:00:00").toLocaleDateString()
                    : "—"}
                </td>
                <td className="flex gap-2">
                  {p.status === "pending" && (
                    <button
                      className="btn btn-success"
                      onClick={() => handleConfirm(p.id)}
                    >
                      Confirmar
                    </button>
                  )}
                  {p.status !== "canceled" && (
                    <button
                      className="btn btn-danger"
                      onClick={() => handleCancel(p.id)}
                    >
                      Anular
                    </button>
                  )}
                  <button
                    className="btn btn-outline"
                    onClick={() => handleViewReceipt(p)}
                  >
                    Ver comprobante
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {selectedPayment && (
        <PaymentReceiptModal
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
        />
      )}
    </>
  );
}
