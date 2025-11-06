import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import PaymentList from "./PaymentList";
import RegisterPaymentModal from "../Dashboard/RegisterPaymentModal";
import { ChargeOrder } from "../../types/payments";
import { useInvalidateChargeOrders } from "../../hooks/payments/useInvalidateChargeOrders";

interface Props {
  order: ChargeOrder;
  isSelected?: boolean;
  onRegisterPayment?: () => void; // 👈 añadida para integración con ChargeOrderList
}

export default function ChargeOrderRow({ order, isSelected, onRegisterPayment }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const invalidateChargeOrders = useInvalidateChargeOrders();

  // 🔹 Exportar usando siempre order.id real y tipando correctamente el Blob
  const handleExport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await axios.get(
        `http://127.0.0.1/api/charge-orders/${order.id}/export/`,
        { responseType: "blob" }
      );

      const blob = res.data as Blob;
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `orden-${order.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exportando orden", err);
      alert("No se pudo exportar la orden. Verifica el endpoint en el backend.");
    }
  };

  const handleViewDetail = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/charge-orders/${order.id}`);
  };

  const handleRegisterPaymentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRegisterPayment) {
      // 👉 si viene del padre, delega la acción
      onRegisterPayment();
    } else {
      // 👉 si no, abre su propio modal
      setShowModal(true);
    }
  };

  const formattedDate = order.appointment_date
    ? new Date(order.appointment_date).toLocaleDateString()
    : order.issued_at
    ? new Date(order.issued_at).toLocaleDateString()
    : "—";

  const formattedAmount =
    order.total_amount !== undefined
      ? Number(order.total_amount).toFixed(2)
      : order.total !== undefined
      ? Number(order.total).toFixed(2)
      : "0.00";

  const patientName =
    order.patient_detail?.full_name ?? `Paciente #${order.patient}`;

  return (
    <div
      className={`charge-order-row card ${
        isSelected ? "ring-2 ring-blue-500 bg-blue-50" : ""
      }`}
    >
      <div
        className="charge-order-header flex justify-between items-center"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex gap-4 items-center">
          <span className="font-semibold">{patientName}</span>
          <span>{formattedDate}</span>
          <span>${formattedAmount}</span>
          <span
            className={`badge ${
              order.status === "paid"
                ? "badge-success"
                : order.status === "open"
                ? "badge-warning"
                : order.status === "partially_paid"
                ? "badge-info"
                : order.status === "void"
                ? "badge-danger"
                : "badge-muted"
            }`}
          >
            {order.status === "paid" && "Pagada"}
            {order.status === "open" && "Abierta"}
            {order.status === "partially_paid" && "Parcialmente pagada"}
            {order.status === "void" && "Anulada"}
          </span>
        </div>

        <div className="actions flex gap-2">
          <button className="btn btn-primary" onClick={handleRegisterPaymentClick}>
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

      {/* Modal local solo si no se delega al padre */}
      {showModal && !onRegisterPayment && (
        <RegisterPaymentModal
          appointmentId={order.appointment}
          chargeOrderId={order.id}
          onClose={() => {
            setShowModal(false);
            invalidateChargeOrders(order.id);
          }}
          onSuccess={() => {
            console.log("Pago registrado en orden", order.id);
            invalidateChargeOrders(order.id);
          }}
        />
      )}
    </div>
  );
}
