import { useState } from "react";
import PaymentList from "./PaymentList";
import RegisterPaymentModal from "./RegisterPaymentModal";
import { ChargeOrder } from "../../types/payments";

interface Props {
  order: ChargeOrder;
}

export default function ChargeOrderRow({ order }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleExport = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Exportar orden", order.id);
    // TODO: exportar comprobante
  };

  const handleViewDetail = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Ver detalle de orden", order.id);
    // TODO: navegar a detalle de orden
  };

  const handleRegisterPayment = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowModal(true);
  };

  // --- Parseo defensivo ---
  const formattedDate = order.appointment_date
    ? new Date(order.appointment_date + "T00:00:00").toLocaleDateString()
    : "—";

  const formattedAmount = order.total_amount
    ? parseFloat(order.total_amount).toFixed(2)
    : "0.00";

  return (
    <div className="charge-order-row card">
      <div
        className="charge-order-header flex justify-between items-center"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex gap-4 items-center">
          <span className="font-semibold">{order.patient.full_name}</span>
          <span>{formattedDate}</span>
          <span>${formattedAmount}</span>
          <span
            className={`badge ${
              order.status === "paid"
                ? "badge-success"
                : order.status === "pending"
                ? "badge-warning"
                : order.status === "canceled"
                ? "badge-danger"
                : "badge-muted"
            }`}
          >
            {order.status === "paid" && "Pagada"}
            {order.status === "pending" && "Pendiente"}
            {order.status === "canceled" && "Cancelada"}
            {order.status === "waived" && "Condonada"}
          </span>
        </div>

        {/* Acciones rápidas */}
        <div className="actions flex gap-2">
          <button className="btn btn-primary" onClick={handleRegisterPayment}>
            Registrar pago
          </button>
          <button className="btn btn-outline" onClick={handleExport}>
            Exportar
          </button>
          <button className="btn btn-outline" onClick={handleViewDetail}>
            Ver detalle
          </button>
        </div>
      </div>

      {expanded && <PaymentList payments={order.payments || []} />}

      {showModal && (
        <RegisterPaymentModal
          orderId={order.appointment}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
