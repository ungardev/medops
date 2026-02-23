// src/components/Appointments/AppointmentDetail.tsx
import { useState } from "react";
import { Appointment } from "../../types/appointments";
import { useAppointment } from "../../hooks/appointments";
import { 
  XMarkIcon, 
  PencilIcon, 
  InformationCircleIcon, 
  BanknotesIcon,
  ShieldCheckIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";
interface Props {
  appointment: Appointment;
  onClose: () => void;
  onEdit: (appointment: Appointment) => void;
}
const METHOD_LABELS: Record<string, string> = {
  cash: "Efectivo",
  card: "Tarjeta / Punto de Venta",
  transfer: "Transferencia / Pago Móvil",
  zelle: "Zelle / Divisas",
  crypto: "Criptomonedas",
  other: "Otro",
};
export default function AppointmentDetail({ appointment, onClose, onEdit }: Props) {
  const [activeTab, setActiveTab] = useState<"info" | "payments">("info");
  
  // ✅ Fetch del appointment completo con datos financieros
  const { data: detailData, isLoading, isError } = useAppointment(appointment.id);

  // DEBUG
  console.log('[AppointmentDetail] props.appointment:', appointment);
  console.log('[AppointmentDetail] appointment.id:', appointment?.id);
  console.log('[AppointmentDetail] detailData:', detailData);
  console.log('[AppointmentDetail] isLoading:', isLoading);
  console.log('[AppointmentDetail] isError:', isError);
  
  // Usar datos del fetch si están disponibles, si no usar prop
  const appt = detailData || appointment;
  
  // ✅ Obtener charge_order y payments
  const chargeOrder = appt?.charge_order;
  const payments = Array.isArray(chargeOrder?.payments) ? chargeOrder.payments : [];
  
  const totalAmount = Number(chargeOrder?.total_amount ?? appt?.expected_amount ?? 0);
  const totalPagado = payments.reduce(
    (acc: number, p: any) => acc + Number(p.amount ?? 0),
    0
  );
  const balanceDue = Number(chargeOrder?.balance_due ?? 0);
  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "---";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      }).toUpperCase();
    } catch {
      return dateStr;
    }
  };
  const formatPaymentDate = (isoString: string | null | undefined) => {
    if (!isoString) return "---";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return "---";
    }
  };
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="max-w-lg w-full bg-[#0a0a0b] border border-white/10 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/10 bg-black/40">
          <div className="flex items-center gap-3">
            <div className="p-2 border border-white/20 text-white/60 bg-white/5">
              <ShieldCheckIcon className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-white/60 uppercase tracking-[0.3em]">
                Registry_Intelligence_Unit
              </span>
              <h2 className="text-lg font-black text-white uppercase">
                Record_Detail <span className="text-white/40 font-mono ml-2">#{appt.id?.toString().padStart(6, '0') || '000000'}</span>
              </h2>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              type="button"
              className="p-2 border border-white/10 text-white/40 hover:text-white hover:border-white/30 transition-all"
              onClick={() => onEdit(appt)}
              title="MODIFY_RECORD"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="p-2 border border-white/10 text-white/40 hover:text-red-500 hover:border-red-500/50 transition-all"
              onClick={onClose}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        {/* Loading State */}
        {isLoading && (
          <div className="p-10 flex flex-col items-center justify-center">
            <ArrowPathIcon className="w-6 h-6 text-white/40 animate-spin mb-3" />
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest animate-pulse">
              SYNCHRONIZING_FINANCIAL_DATA...
            </span>
          </div>
        )}
        {/* Error State */}
        {isError && !detailData && (
          <div className="p-6 text-center">
            <span className="text-[10px] font-mono text-red-400 uppercase">
              ERROR_LOADING_FINANCIAL_DATA
            </span>
            <p className="text-[9px] text-white/30 mt-2">
              Mostrando datos básicos del registro
            </p>
          </div>
        )}
        {/* Content */}
        {!isLoading && (
          <>
            {/* Tabs */}
            <div className="flex border-b border-white/10 bg-black/20">
              {[
                { id: "info", label: "INTEL_REPORT", icon: InformationCircleIcon },
                { id: "payments", label: "FISCAL_LEDGER", icon: BanknotesIcon }
              ].map((tab) => (
                <button
                  key={tab.id}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black tracking-widest transition-all border-b-2 ${
                    activeTab === tab.id 
                      ? "bg-white/5 border-white/30 text-white" 
                      : "border-transparent text-white/30 hover:text-white/70"
                  }`}
                  onClick={() => setActiveTab(tab.id as any)}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="p-6">
              {activeTab === "info" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <DataField label="Subject_Name" value={appt.patient?.full_name || "UNKNOWN"} highlight />
                    <DataField label="Op_Classification" value={appt.appointment_type || "---"} />
                    <DataField label="Execution_Date" value={formatDate(appt.appointment_date)} />
                    <DataField label="Current_Status" value={appt.status?.toUpperCase() || "---"} />
                  </div>
                  
                  {appt.notes && (
                    <div className="mt-4 p-3 bg-black/20 border border-white/5">
                      <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Operational_Notes</span>
                      <p className="text-[11px] text-white/80 mt-1">{appt.notes}</p>
                    </div>
                  )}
                  
                  <div className="mt-6 p-4 bg-black/30 border border-white/5">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Budget_Overview</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="text-[8px] text-white/40 uppercase">Total_Order</span>
                        <p className="text-xl font-mono text-white">${totalAmount.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[8px] text-white/40 uppercase">Collected_To_Date</span>
                        <p className="text-xl font-mono text-emerald-500">${totalPagado.toFixed(2)}</p>
                      </div>
                    </div>
                    {balanceDue > 0 && (
                      <div className="mt-3 pt-3 border-t border-white/10 flex justify-between items-end">
                        <span className="text-[8px] text-white/40 uppercase">Outstanding_Balance</span>
                        <p className="text-lg font-mono text-red-400">${balanceDue.toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {activeTab === "payments" && (
                <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
                  <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4">Transaction_History</h3>
                  
                  {chargeOrder ? (
                    <>
                      <div className="p-3 bg-white/5 border border-white/10 mb-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-[8px] text-white/40 uppercase">Order_ID</span>
                            <p className="text-sm font-mono text-white">#{chargeOrder.id}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-[8px] text-white/40 uppercase">Status</span>
                            <p className="text-sm font-bold uppercase text-emerald-500">{chargeOrder.status}</p>
                          </div>
                        </div>
                      </div>
                      
                      {payments.length > 0 ? (
                        payments.map((p: any, idx: number) => (
                          <div key={p.id || idx} className="flex justify-between items-center p-3 bg-black/20 border border-white/5">
                            <div className="flex flex-col">
                              <span className="text-[10px] text-emerald-500 font-bold">+ ${Number(p.amount).toFixed(2)}</span>
                              <span className="text-[8px] text-white/40 uppercase">{METHOD_LABELS[p.method] || p.method}</span>
                            </div>
                            <div className="text-right flex flex-col">
                              <span className="text-[9px] text-white uppercase">{p.status || "CONFIRMED"}</span>
                              {p.reference_number && <span className="text-[8px] text-white/40">REF: {p.reference_number}</span>}
                              {p.received_at && <span className="text-[7px] text-white/30">{formatPaymentDate(p.received_at)}</span>}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-8 text-center border border-dashed border-white/10">
                          <span className="text-[10px] font-mono text-white/30">-- NO_PAYMENTS_REGISTERED --</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="py-8 text-center border border-dashed border-white/10">
                      <span className="text-[10px] font-mono text-white/30">-- NO_CHARGE_ORDER_FOUND --</span>
                      <p className="text-[9px] font-mono text-white/20 mt-2">Expected Amount: ${appt.expected_amount || "0.00"}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
        {/* Footer */}
        <div className="px-6 py-3 bg-black/40 border-t border-white/5 flex justify-between items-center text-[8px] font-mono text-white/30 uppercase tracking-widest">
          <span>Record_ID: {appt.id || 'N/A'}</span>
          <span>Security_Level: STANDARD</span>
        </div>
      </div>
    </div>
  );
}
function DataField({ label, value, highlight }: { label: string; value: any; highlight?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest mb-0.5">{label}</span>
      <span className={`text-xs font-mono uppercase ${highlight ? 'text-white font-black' : 'text-white/80'}`}>
        {value || "---"}
      </span>
    </div>
  );
}