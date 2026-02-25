// src/components/Payments/ChargeOrderRow.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PaymentList from "./PaymentList";
import { ChargeOrder } from "../../types/payments";
import { formatCurrency } from "@/utils/format";
import { 
  CreditCardIcon, 
  EyeIcon, 
  ArrowDownTrayIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  UserGroupIcon
} from "@heroicons/react/24/outline";
interface ChargeOrderRowProps {
  order: ChargeOrder;
  isSelected?: boolean;
  onRegisterPayment?: (orderId: number, appointmentId: number) => void;
}
export default function ChargeOrderRow({ order, isSelected, onRegisterPayment }: ChargeOrderRowProps) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  // --- LÓGICA DE EXPORTACIÓN ---
  const handleExport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/charge-orders/${order.id}/export/`,
        {
          method: "GET",
          headers: { ...(token ? { Authorization: `Token ${token}` } : {}) },
          credentials: "include",
        }
      );
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ORD_${order.id}_RAW_DATA.pdf`;
      link.click();
    } catch (err) {
      console.error("Export failed");
    }
  };
  const formattedDate = order.appointment_date
    ? new Date(order.appointment_date).toLocaleDateString('en-GB')
    : "—";
  const patientName = order.patient_detail?.full_name ?? `SUBJECT_ID: ${order.patient}`;
  // --- CONFIGURACIÓN DE STATUS ---
  const statusConfig = {
    paid: { label: "SETTLED", class: "text-emerald-400 border-emerald-500/30 bg-emerald-500/5" },
    open: { label: "UNRESOLVED", class: "text-yellow-500 border-yellow-500/30 bg-yellow-500/5" },
    partially_paid: { label: "PARTIAL", class: "text-blue-400 border-blue-500/30 bg-blue-500/5" },
    void: { label: "ANNULLED", class: "text-red-400 border-red-500/30 bg-red-500/5" },
    default: { label: "UNKNOWN", class: "text-[var(--palantir-muted)] border-white/10" }
  };
  const currentStatus = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.default;
  return (
    <div 
      className={`
        group border-b border-white/5 transition-all
        ${expanded ? "bg-white/[0.03]" : "hover:bg-white/[0.02]"}
        ${isSelected ? "border-l-2 border-l-[var(--palantir-active)]" : "border-l-2 border-l-transparent"}
      `}
    >
      {/* FILA PRINCIPAL (GRID) */}
      <div 
        className="grid grid-cols-12 gap-4 px-4 sm:px-6 py-4 items-center cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {/* ID & ICON */}
        <div className="col-span-1 hidden sm:flex items-center gap-3">
          {expanded ? <ChevronUpIcon className="w-3 h-3 text-[var(--palantir-muted)]" /> : <ChevronDownIcon className="w-3 h-3 text-[var(--palantir-muted)]" />}
          <span className="text-[9px] font-mono text-[var(--palantir-muted)]">#{order.id.toString().padStart(4, '0')}</span>
        </div>
        {/* ✅ CAMBIO 1: PACIENTE - text-[12px] font-bold (era 10px font-black) */}
        <div className="col-span-11 sm:col-span-4">
          <p className="text-[12px] font-bold uppercase tracking-wider truncate group-hover:text-emerald-400 transition-colors">
            {patientName}
          </p>
          
          {/* Médico responsable */}
          {order.doctor && (
            <div className="flex items-center gap-1 text-xs font-mono text-[var(--palantir-muted)] mt-1">
              <UserGroupIcon className="w-3.5 h-3.5" />
              <span>{order.doctor.full_name}</span>
              {order.doctor.is_verified && (
                <span className="text-emerald-500 text-[8px] ml-1">● VERIFIED</span>
              )}
            </div>
          )}
          
          <p className="text-[8px] font-mono text-[var(--palantir-muted)] sm:hidden uppercase mt-1">
            {formattedDate} • {formatCurrency(order.total_amount ?? order.total, order.currency)}
          </p>
        </div>
        {/* ✅ CAMBIO 2: FECHA - text-[11px] font-mono (era 10px) */}
        <div className="col-span-2 hidden sm:block text-[11px] font-mono text-[var(--palantir-muted)]">
          {formattedDate}
        </div>
        {/* ✅ CAMBIO 3: MONTO - text-[12px] font-bold (era 11px font-black) */}
        <div className="col-span-2 hidden sm:block text-right">
          <span className="text-[12px] font-bold font-mono text-[var(--palantir-text)] group-hover:text-emerald-400 transition-colors">
            {formatCurrency(order.total_amount ?? order.total, order.currency)}
          </span>
        </div>
        {/* STATUS */}
        <div className="col-span-12 sm:col-span-2 flex justify-start sm:justify-center items-center">
          <span className={`px-2 py-0.5 border text-[8px] font-black tracking-[0.1em] rounded-sm ${currentStatus.class}`}>
            {currentStatus.label}
          </span>
        </div>
        {/* ACCIONES (Reveladas en Hover) */}
        <div className="col-span-1 hidden sm:flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={(e) => { e.stopPropagation(); onRegisterPayment?.(order.id, order.appointment); }}
            className="p-1.5 hover:text-emerald-400 transition-colors" title="Post Payment"
          >
            <CreditCardIcon className="w-4 h-4" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); navigate(`/charge-orders/${order.id}`); }}
            className="p-1.5 hover:text-[var(--palantir-active)] transition-colors" title="Deep Inspection"
          >
            <EyeIcon className="w-4 h-4" />
          </button>
          <button 
            onClick={handleExport}
            className="p-1.5 hover:text-white transition-colors" title="Export PDF"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
      {/* ÁREA EXPANDIDA: DETALLE DE PAGOS */}
      {expanded && (
        <div className="px-6 pb-6 pt-2 bg-black/20 border-t border-white/5 animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-4 mb-4 opacity-50">
            <div className="h-[1px] flex-grow bg-white/10"></div>
            <span className="text-[8px] font-mono uppercase tracking-[0.3em]">Associated_Transactions</span>
            <div className="h-[1px] flex-grow bg-white/10"></div>
          </div>
          
          {/* Metadata de institución */}
          <div className="mb-4 pb-4 border-b border-white/5">
            <div className="flex items-center gap-2 text-[9px] font-mono text-[var(--palantir-muted)]">
              <span className="uppercase tracking-wider">Institution:</span>
              <span className="text-[var(--palantir-text)]">{order.institution?.name}</span>
              {order.institution?.tax_id && (
                <>
                  <span className="text-white/20">|</span>
                  <span>{order.institution.tax_id}</span>
                </>
              )}
            </div>
          </div>
          
          <div className="rounded-sm border border-white/5 bg-white/[0.01] overflow-hidden">
            <PaymentList payments={order.payments || []} hideSummaryBadges={false} />
          </div>
          <div className="mt-4 flex justify-end gap-3">
             <button 
               onClick={(e) => { e.stopPropagation(); onRegisterPayment?.(order.id, order.appointment); }}
               className="text-[9px] font-mono border border-emerald-500/50 text-emerald-500 px-3 py-1 hover:bg-emerald-500/10 transition-all uppercase tracking-widest"
             >
               Execute_New_Payment
             </button>
          </div>
        </div>
      )}
    </div>
  );
}