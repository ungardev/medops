import { useState } from "react";
import axios from "axios";
import PaymentList from "./PaymentList";
import RegisterPaymentModal from "./RegisterPaymentModal";
import { ChargeOrder } from "../../types/payments";

interface Props {
  order: ChargeOrder;
  isSelected?: boolean; // <- añadida para resaltar la fila seleccionada
}

export default function ChargeOrderRow({ order, isSelected }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleExport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await axios.get(`/charge-orders/${order.id}/export/`, {
        responseType: "blob",
      });

      // Detecta si el backend devolvió PDF o JSON
      const contentType = res.headers["content-type"];
      const isPdf = contentType?.includes("pdf");

      const blob = new Blob([res.data as BlobPart], {
        type: isPdf ? "application/pdf" : "application/json",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `orden-${order.id}.${isPdf ? "pdf" : "json"}`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Error exportando orden", err);
    }
  };

  const handleViewDetail = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Ver detalle de orden", order.id);
  };

  const handleRegisterPayment = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowModal(true);
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
