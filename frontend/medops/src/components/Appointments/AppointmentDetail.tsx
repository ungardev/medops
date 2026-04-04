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
      });
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
  const statusLabels: Record<string, string> = {
    pending: 'Pendiente',
    tentative: 'Tentativa',
    arrived: 'Confirmada',
    in_consultation: 'En consulta',
    completed: 'Completada',
    canceled: 'Cancelada',
  };
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="flex flex-col items-center gap-4">
          <ArrowPathIcon className="w-8 h-8 text-white/30 animate-spin" />
          <span className="text-[11px] text-white/40">Cargando cita...</span>
        </div>
      </div>
    );
  }
  if (!appt) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="max-w-md w-full bg-[#1a1a1b] border border-red-500/20 p-6 rounded-lg">
          <p className="text-red-400 text-center text-sm">Cita no encontrada</p>
          <button onClick={onClose} className="mt-4 w-full py-2.5 bg-white/5 text-white/60 hover:text-white rounded-lg transition-colors text-sm">Cerrar</button>
        </div>
      </div>
    );
  }
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="max-w-lg w-full bg-[#1a1a1b] border border-white/15 shadow-2xl overflow-hidden rounded-lg">
        
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/15 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 border border-white/15 bg-white/5 rounded-lg">
              <CalendarIcon className="h-5 w-5 text-white/50" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-medium text-white/40 uppercase tracking-wider">
                Cita Médica
              </span>
              <h2 className="text-[14px] font-semibold text-white">
                #{appt.id?.toString().padStart(6, '0') || '000000'}
              </h2>
            </div>
          </div>
          
          <div className="flex gap-2">
            {!readOnly && (
              <button
                type="button"
                className="p-2 border border-white/15 bg-white/5 text-white/40 hover:text-white hover:border-white/25 transition-all rounded-lg"
                onClick={() => onEdit(appt.id)}
                title="Editar cita"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              className="p-2 border border-white/15 bg-white/5 text-white/40 hover:text-red-400 hover:border-red-500/25 transition-all rounded-lg"
              onClick={onClose}
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          
          <div className="space-y-3">
            <h3 className="text-[10px] font-medium text-white/50 uppercase tracking-wider">
              Información del Paciente
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[9px] text-white/40 uppercase">Nombre</span>
                <p className="text-white/80 font-medium text-sm">{appt.patient?.full_name || "N/A"}</p>
              </div>
              <div>
                <span className="text-[9px] text-white/40 uppercase">Tipo</span>
                <p className="text-white/80 font-medium text-sm">{appt.appointment_type === 'general' ? 'General' : appt.appointment_type || "---"}</p>
              </div>
              <div>
                <span className="text-[9px] text-white/40 uppercase">Fecha</span>
                <p className="text-white/80 font-medium text-sm">{formatDate(appt.appointment_date)}</p>
              </div>
              <div>
                <span className="text-[9px] text-white/40 uppercase">Estado</span>
                <p className="text-white/80 font-medium text-sm">{statusLabels[appt.status] || appt.status || "---"}</p>
              </div>
            </div>
            
            {appt.notes && (
              <div className="mt-4 p-3 bg-white/5 border border-white/10 rounded-lg">
                <span className="text-[9px] font-medium text-white/40 uppercase">Notas</span>
                <p className="text-[11px] text-white/60 mt-1 leading-relaxed">{appt.notes}</p>
              </div>
            )}
          </div>
          <div className="space-y-3">
            <h3 className="text-[10px] font-medium text-white/50 uppercase tracking-wider">
              Resumen Financiero
            </h3>
            <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <span className="text-[9px] text-white/40 uppercase">Total</span>
                  <p className="text-lg font-semibold text-white mt-1">${totalAmount.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-[9px] text-white/40 uppercase">Pagado</span>
                  <p className="text-lg font-semibold text-emerald-400 mt-1">${totalPagado.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-[9px] text-white/40 uppercase">Pendiente</span>
                  <p className="text-lg font-semibold text-red-400 mt-1">${balanceDue.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-[10px] font-medium text-white/50 uppercase tracking-wider">
              Servicios
            </h3>
            {items.length > 0 ? (
              <div className="space-y-2">
                {items.map((item: any, idx: number) => (
                  <div key={item.id || idx} className="flex justify-between items-center p-3 bg-white/5 border border-white/10 rounded-lg">
                    <div className="flex-1">
                      <p className="text-white/80 text-sm">{item.description || item.code}</p>
                      <p className="text-[9px] text-white/30">{item.code} × {item.qty}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white/80 font-medium">${item.subtotal?.toFixed(2) || '0.00'}</p>
                      <p className="text-[8px] text-white/30">${item.unit_price?.toFixed(2)} c/u</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center border border-dashed border-white/10 rounded-lg">
                <span className="text-[10px] text-white/30">Sin servicios registrados</span>
              </div>
            )}
          </div>
          <div className="space-y-3">
            <h3 className="text-[10px] font-medium text-white/50 uppercase tracking-wider">
              Pagos
            </h3>
            {payments.length > 0 ? (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {payments.map((p: any, idx: number) => (
                  <div key={p.id || idx} className="flex justify-between items-center p-3 bg-white/5 border border-white/10 rounded-lg">
                    <div className="flex-1">
                      <p className="text-emerald-400 font-semibold">+ ${Number(p.amount).toFixed(2)}</p>
                      <p className="text-[9px] text-white/40">{METHOD_LABELS[p.method] || p.method}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-white/60">{p.status === 'confirmed' ? 'Confirmado' : p.status || "Pendiente"}</p>
                      {p.received_at && (
                        <p className="text-[8px] text-white/30">{formatPaymentDate(p.received_at)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center border border-dashed border-white/10 rounded-lg">
                <span className="text-[10px] text-white/30">Sin pagos registrados</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="px-6 py-3 bg-white/5 border-t border-white/15 flex justify-between items-center text-[9px] text-white/30 uppercase tracking-wider">
          <span>Cita #{appt.id || 'N/A'}</span>
          <span className={appt.status === 'completed' ? 'text-emerald-400' : 'text-white/40'}>
            {statusLabels[appt.status] || appt.status?.toUpperCase() || 'PENDIENTE'}
          </span>
        </div>
      </div>
    </div>
  );
}