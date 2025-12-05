// src/components/Payments/ChargeOrderRow.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import PaymentList from "./PaymentList";
import { ChargeOrder } from "../../types/payments";
import { useInvalidateChargeOrders } from "../../hooks/payments/useInvalidateChargeOrders";
import { CreditCard, ArrowUpSquare, Eye } from "lucide-react";

interface Props {
  order: ChargeOrder;
  isSelected?: boolean;
  onRegisterPayment?: () => void;
}

export default function ChargeOrderRow({ order, isSelected, onRegisterPayment }: Props) {
  const [expanded, setExpanded] = useState(false);
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
    onRegisterPayment?.();
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
      : "bg-gray-100 text-[#0d2c53] ring-gray-200 dark:bg-gray-700 dark:text-gray-200";

  const confirmed = order.payments?.filter(p => p.status === "confirmed")
    .reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;

  const pending = order.payments?.filter(p => p.status === "pending")
    .reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;

  const rejected = order.payments?.filter(p => p.status === "rejected")
    .reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;
    return (
    <div
      className={`relative rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-3 sm:p-4 mb-2 sm:mb-3 cursor-pointer 
        ${isSelected ? "ring-2 ring-[#0d2c53] bg-[#0d2c53]/10 dark:bg-[#0d2c53]/30" : "bg-white dark:bg-gray-900"}`}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Íconos solo en mobile/tablet (para evitar doble render en desktop) */}
      <div className="absolute top-2 right-2 sm:hidden flex flex-row gap-3 text-[#0d2c53] dark:text-gray-200">
        <CreditCard className="w-5 h-5 cursor-pointer hover:text-[#0b2444]" onClick={handleRegisterPaymentClick} />
        <Eye className="w-5 h-5 cursor-pointer hover:text-[#0b2444]" onClick={handleViewDetail} />
        <ArrowUpSquare className="w-5 h-5 cursor-pointer hover:text-[#0b2444]" onClick={handleExport} />
      </div>

      {/* Vista compacta (mobile/tablet) */}
      <div className="flex flex-col gap-2 text-[11px] text-[#0d2c53] dark:text-gray-100 sm:hidden">
        <span className="font-semibold">{patientName}</span>
        <span>{formattedDate}</span>
        <span>${formattedAmount}</span>
        <span
          className={`inline-flex items-center rounded-md px-1 py-0.5 text-[11px] font-medium ring-1 ring-inset max-w-max ${statusClass}`}
        >
          {statusLabel}
        </span>
      </div>

      {/* Vista desktop con íconos dentro del layout (sin absolute) */}
      <div className="hidden sm:flex justify-between items-center">
        <div className="flex flex-wrap gap-2 sm:gap-4 items-center text-xs sm:text-sm text-[#0d2c53] dark:text-gray-100">
          <span className="font-semibold">{patientName}</span>
          <span>{formattedDate}</span>
          <span>${formattedAmount}</span>
          <span className={`inline-flex items-center rounded-md px-1.5 sm:px-2 py-0.5 sm:py-1 text-[11px] sm:text-xs font-medium ring-1 ring-inset max-w-max ${statusClass}`}>
            {statusLabel}
          </span>
        </div>

        <div className="flex flex-row gap-3 text-[#0d2c53] dark:text-gray-200">
          <CreditCard className="w-5 h-5 cursor-pointer hover:text-[#0b2444]" onClick={handleRegisterPaymentClick} />
          <Eye className="w-5 h-5 cursor-pointer hover:text-[#0b2444]" onClick={handleViewDetail} />
          <ArrowUpSquare className="w-5 h-5 cursor-pointer hover:text-[#0b2444]" onClick={handleExport} />
        </div>
      </div>

      {/* Expandido */}
      {expanded && (
        <div className="mt-2 sm:mt-3">
          <div className="flex flex-wrap gap-2 sm:hidden text-[11px] mb-2">
            {[
              { label: "Total", value: order.total_amount ?? order.total, className: "bg-gray-100 text-[#0d2c53] dark:bg-gray-700 dark:text-gray-200" },
              { label: "Confirmados", value: confirmed, className: "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200" },
              { label: "Pendientes", value: pending, className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-200" },
              { label: "Rechazados", value: rejected, className: "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200" },
            ]
              .filter(b => b.value !== undefined && Number(b.value) > 0)
              .map((b, idx) => (
                <span key={idx} className={`inline-flex items-center rounded-md px-2 py-0.5 font-medium ring-1 ring-inset ${b.className}`}>
                  <strong>{b.label}:</strong> ${Number(b.value).toFixed(2)}
                </span>
              ))}
          </div>

          <div className="sm:hidden">
            <PaymentList payments={order.payments || []} hideSummaryBadges />
          </div>
          <div className="hidden sm:block">
            <PaymentList payments={order.payments || []} />
          </div>
        </div>
      )}
    </div>
  );
}
