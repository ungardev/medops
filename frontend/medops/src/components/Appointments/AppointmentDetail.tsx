// src/components/Appointments/AppointmentDetail.tsx
import { useState } from "react";
import { useAppointment } from "../../hooks/appointments";
import { 
  XMarkIcon, 
  PencilIcon, 
  CalendarIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";
interface Props {
  appointmentId: number;
  onClose: () => void;
  onEdit: (id: number) => void;
  readOnly?: boolean;
}
const METHOD_LABELS: Record<string, string> = {
  cash: "Efectivo",
  card: "Tarjeta / Punto de Venta",
  transfer: "Transferencia / Pago Móvil",
  zelle: "Zelle / Divisas",
  crypto: "Criptomonedas",
  other: "Otro",
};
export default function AppointmentDetail({ appointmentId, onClose, onEdit, readOnly = false }: Props) {
  const { data: appt, isLoading, isError } = useAppointment(appointmentId);
  
  const chargeOrder = appt?.charge_order;
  const items = Array.isArray(chargeOrder?.items) ? chargeOrder.items : [];
  const payments = Array.isArray(chargeOrder?.payments) ? chargeOrder.payments : [];
  
  const chargeOrderTotal = chargeOrder?.total_amount ?? 0;
  const expectedTotal = Number(appt?.expected_amount ?? 0);
  const totalAmount = chargeOrderTotal > 0 ? chargeOrderTotal : expectedTotal;
  
  const totalPagado = payments.reduce(
    (acc: number, p: any) => acc + Number(p.amount ?? 0),
    0
  );
  
  const balanceDue = totalAmount - totalPagado;
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
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4">
        <div className="flex flex-col items-center gap-4">
          <ArrowPathIcon className="w-8 h-8 text-white/40 animate-spin" />
          <span className="text-[10px] font-mono text-white/40 uppercase">Cargando...</span>
        </div>
      </div>
    );
  }
  if (!appt) {
    return (
      <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4">
        <div className="max-w-md w-full bg-[#0a0a0b] border border-red-500/30 p-6">
          <p className="text-red-400 text-center">CITA NO ENCONTRADA</p>
          <button onClick={onClose} className="mt-4 w-full py-2 bg-white/10 text-white">CERRAR</button>
        </div>
      </div>
    );
  }
  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4">
      <div className="max-w-lg w-full bg-[#0a0a0b] border border-white/10 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 border border-white/20 text-white/60 bg-white/5">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-white/60 uppercase tracking-[0.3em]">
                CITA MÉDICA
              </span>
              <h2 className="text-lg font-black text-white uppercase">
                #{appt.id?.toString().padStart(6, '0') || '000000'}
              </h2>
            </div>
          </div>
          
          <div className="flex gap-2">
            {!readOnly && (
              <button
                type="button"
                className="p-2 border border-white/10 text-white/40 hover:text-white hover:border-white/30 transition-all"
                onClick={() => onEdit(appt.id)}
                title="EDITAR CITA"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
            )}
            <button
              type="button"
              className="p-2 border border-white/10 text-white/40 hover:text-red-500 hover:border-red-500/50 transition-all"
              onClick={onClose}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* Contenido */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          
          {/* Información del Paciente */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
              INFORMACIÓN DEL PACIENTE
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[8px] text-white/40 uppercase">Nombre</span>
                <p className="text-white font-medium">{appt.patient?.full_name || "N/A"}</p>
              </div>
              <div>
                <span className="text-[8px] text-white/40 uppercase">Tipo</span>
                <p className="text-white font-medium">{appt.appointment_type || "---"}</p>
              </div>
              <div>
                <span className="text-[8px] text-white/40 uppercase">Fecha</span>
                <p className="text-white font-medium">{formatDate(appt.appointment_date)}</p>
              </div>
              <div>
                <span className="text-[8px] text-white/40 uppercase">Estado</span>
                <p className="text-white font-medium uppercase">{appt.status || "---"}</p>
              </div>
            </div>
            
            {appt.notes && (
              <div className="mt-4 p-3 bg-white/5 border border-white/10">
                <span className="text-[8px] font-bold text-white/40 uppercase">Notas</span>
                <p className="text-[11px] text-white/80 mt-1">{appt.notes}</p>
              </div>
            )}
          </div>
          {/* Resumen Financiero */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
              RESUMEN FINANCIERO
            </h3>
            <div className="p-4 bg-white/5 border border-white/10">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <span className="text-[8px] text-white/40 uppercase">Total</span>
                  <p className="text-lg font-mono text-white">${totalAmount.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-[8px] text-white/40 uppercase">Pagado</span>
                  <p className="text-lg font-mono text-emerald-400">${totalPagado.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-[8px] text-white/40 uppercase">Pendiente</span>
                  <p className="text-lg font-mono text-red-400">${balanceDue.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
          {/* Servicios */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
              SERVICIOS
            </h3>
            {items.length > 0 ? (
              <div className="space-y-2">
                {items.map((item: any, idx: number) => (
                  <div key={item.id || idx} className="flex justify-between items-center p-3 bg-white/5 border border-white/10">
                    <div className="flex-1">
                      <p className="text-white text-sm">{item.description || item.code}</p>
                      <p className="text-[8px] text-white/40">{item.code} × {item.qty}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-mono">${item.subtotal?.toFixed(2) || '0.00'}</p>
                      <p className="text-[8px] text-white/30">${item.unit_price?.toFixed(2)} c/u</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center border border-dashed border-white/10">
                <span className="text-[10px] font-mono text-white/30">-- SIN SERVICIOS --</span>
              </div>
            )}
          </div>
          {/* Pagos */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
              PAGOS
            </h3>
            {payments.length > 0 ? (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {payments.map((p: any, idx: number) => (
                  <div key={p.id || idx} className="flex justify-between items-center p-3 bg-white/5 border border-white/10">
                    <div className="flex-1">
                      <p className="text-emerald-400 font-bold">+ ${Number(p.amount).toFixed(2)}</p>
                      <p className="text-[8px] text-white/40 uppercase">{METHOD_LABELS[p.method] || p.method}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-white uppercase">{p.status || "CONFIRMADO"}</p>
                      {p.received_at && (
                        <p className="text-[7px] text-white/30">{formatPaymentDate(p.received_at)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center border border-dashed border-white/10">
                <span className="text-[10px] font-mono text-white/30">-- SIN PAGOS --</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-3 bg-white/5 border-t border-white/10 flex justify-between items-center text-[8px] font-mono text-white/30 uppercase tracking-widest">
          <span>CITA #{appt.id || 'N/A'}</span>
          <span className={appt.status === 'completed' ? 'text-emerald-400' : 'text-white/40'}>
            {appt.status?.toUpperCase() || 'PENDIENTE'}
          </span>
        </div>
      </div>
    </div>
  );
}