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
  onRegisterPayment?: () => void;
}

export default function ChargeOrderRow({ order, isSelected, onRegisterPayment }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const invalidateChargeOrders = useInvalidateChargeOrders();

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
      onRegisterPayment();
    } else {
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

  const statusLabel =
    order.status === "paid"
      ? "Pagada"
      : order.status === "open"
      ? "Abierta"
      : order.status === "partially_paid"
      ? "Parcialmente pagada"
      : order.status === "void"
      ? "Anulada"
      : "—";

  const statusClass =
    order.status === "paid"
      ? "bg-green-100 text-green-800 ring-green-200 dark:bg-green-800 dark:text-green-200"
      : order.status === "open"
      ? "bg-yellow-100 text-yellow-800 ring-yellow-200 dark:bg-yellow-700 dark:text-yellow-200"
      : order.status === "partially_paid"
      ? "bg-blue-100 text-blue-800 ring-blue-200 dark:bg-blue-700 dark:text-blue-200"
      : order.status === "void"
      ? "bg-red-100 text-red-800 ring-red-200 dark:bg-red-800 dark:text-red-200"
      : "bg-gray-100 text-gray-800 ring-gray-200 dark:bg-gray-700 dark:text-gray-200";

  return (
    <div
      className={`rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4 mb-3 cursor-pointer 
        ${isSelected ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20" : "bg-white dark:bg-gray-900"}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex justify-between items-center">
        <div className="flex gap-4 items-center text-sm text-gray-800 dark:text-gray-100">
          <span className="font-semibold">{patientName}</span>
          <span>{formattedDate}</span>
          <span>${formattedAmount}</span>
          <span
            className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusClass}`}
          >
            {statusLabel}
          </span>
        </div>

        <div className="flex gap-2">
          <button
            className="px-3 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition text-sm"
            onClick={handleRegisterPaymentClick}
          >
            Registrar pago
          </button>
          <button
            className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 
                       bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 
                       hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm"
            onClick={handleExport}
          >
            Exportar
          </button>
          <button
            className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 
                       bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 
                       hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm"
            onClick={handleViewDetail}
          >
            Ver detalle
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3">
          <PaymentList payments={order.payments || []} />
        </div>
      )}

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
