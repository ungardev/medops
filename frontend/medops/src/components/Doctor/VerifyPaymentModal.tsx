// src/components/Doctor/VerifyPaymentModal.tsx
import React from "react";
import SimpleCalendar from "@/components/Common/SimpleCalendar";
import { Loader2 } from "lucide-react";
import { 
  CheckCircleIcon,
  XCircleIcon,
  PhotoIcon,
  XMarkIcon,
  CalendarIcon
} from "@heroicons/react/24/outline";
import type { PendingPayment } from "@/types/payments";
const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000';
const getFullImageUrl = (url: string | undefined): string => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};
const REJECTION_REASONS = [
  { id: "wrong_amount", label: "Monto incorrecto - El monto no coincide con el esperado" },
  { id: "unreadable", label: "Captura ilegible - Favor subir una más clara" },
  { id: "invalid_ref", label: "Referencia no válida - Número de referencia incorrecto" },
  { id: "wrong_bank", label: "Banco destino incorrecto" },
  { id: "other", label: "Otro motivo" },
];
interface VerifyPaymentModalProps {
  showConfirmAndScheduleModal: boolean;
  selectedPayment: PendingPayment | null;
  confirmAndScheduleDate: Date | null;
  setConfirmAndScheduleDate: (date: Date | null) => void;
  verificationNotes: string;
  setVerificationNotes: (notes: string) => void;
  onConfirmAndSchedule: () => void;
  onCloseConfirmAndSchedule: () => void;
  isConfirming: boolean;
  openImageModal: (url: string) => void;
  
  showRejectModal: boolean;
  selectedReason: string;
  setSelectedReason: (reason: string) => void;
  onRejectPayment: () => void;
  onCloseReject: () => void;
  isRejecting: boolean;
}
export default function VerifyPaymentModal({
  showConfirmAndScheduleModal,
  selectedPayment,
  confirmAndScheduleDate,
  setConfirmAndScheduleDate,
  verificationNotes,
  setVerificationNotes,
  onConfirmAndSchedule,
  onCloseConfirmAndSchedule,
  isConfirming,
  openImageModal,
  showRejectModal,
  selectedReason,
  setSelectedReason,
  onRejectPayment,
  onCloseReject,
  isRejecting,
}: VerifyPaymentModalProps) {
  
  if (showConfirmAndScheduleModal && selectedPayment) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-[#1a1a1b] border border-white/15 w-full max-w-lg rounded-lg shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
          
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/15 bg-white/5">
            <div className="flex items-center gap-3">
              <CalendarIcon className="w-5 h-5 text-emerald-400" />
              <h3 className="text-[12px] font-semibold text-white">Confirmar y Agendar</h3>
            </div>
            <button onClick={onCloseConfirmAndSchedule} className="text-white/40 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <p className="text-[12px] text-white/60 leading-relaxed">
              Confirmar el pago de <span className="text-emerald-400 font-semibold">
                Bs {Number(selectedPayment.amount_ves || 0).toLocaleString('es-VE')}
              </span> del paciente <span className="text-white/80 font-medium">{selectedPayment.patient.full_name}</span> y agendar la cita.
            </p>
            
            {selectedPayment.screenshot && (
              <div>
                <p className="text-[10px] text-white/40 mb-2">Captura adjunta:</p>
                <img 
                  src={getFullImageUrl(selectedPayment.screenshot)} 
                  alt="Captura de pago" 
                  className="max-h-32 rounded-lg border border-white/10 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => openImageModal(getFullImageUrl(selectedPayment.screenshot!))}
                />
              </div>
            )}
            
            <div>
              <label className="block text-[10px] font-medium text-white/50 uppercase tracking-wider mb-2">
                Seleccionar Fecha
              </label>
              <div className="bg-white/5 p-3 rounded-lg border border-white/15">
                <SimpleCalendar
                  selectedDate={confirmAndScheduleDate}
                  onDateSelect={setConfirmAndScheduleDate}
                  serviceSchedules={[]}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-[10px] font-medium text-white/50 uppercase tracking-wider mb-2">
                Notas (opcional)
              </label>
              <textarea
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/15 rounded-lg text-[12px] text-white/80 focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-white/30 resize-none"
                placeholder="Agregar notas..."
                rows={2}
              />
            </div>
          </div>
          
          <div className="flex gap-3 px-6 py-4 border-t border-white/15 bg-white/5">
            <button
              onClick={onCloseConfirmAndSchedule}
              className="flex-1 px-4 py-2.5 border border-white/15 text-white/60 text-[11px] font-medium rounded-lg hover:bg-white/5 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirmAndSchedule}
              disabled={!confirmAndScheduleDate || isConfirming}
              className="flex-1 px-4 py-2.5 bg-emerald-500/15 text-emerald-400 text-[11px] font-medium rounded-lg hover:bg-emerald-500/25 disabled:opacity-50 transition-all border border-emerald-500/25"
            >
              {isConfirming 
                ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> 
                : "Confirmar y Agendar"}
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (showRejectModal && selectedPayment) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-[#1a1a1b] border border-white/15 w-full max-w-md rounded-lg shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
          
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/15 bg-white/5">
            <div className="flex items-center gap-3">
              <XCircleIcon className="w-5 h-5 text-red-400" />
              <h3 className="text-[12px] font-semibold text-white">Rechazar Pago</h3>
            </div>
            <button onClick={onCloseReject} className="text-white/40 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <p className="text-[12px] text-white/60 leading-relaxed">
              ¿Rechazar el pago de <span className="text-red-400 font-semibold">
                Bs {Number(selectedPayment.amount_ves || 0).toLocaleString('es-VE')}
              </span> del paciente <span className="text-white/80 font-medium">{selectedPayment.patient.full_name}</span>?
            </p>
            
            {selectedPayment.screenshot && (
              <div>
                <p className="text-[10px] text-white/40 mb-2">Captura adjunta:</p>
                <img 
                  src={getFullImageUrl(selectedPayment.screenshot)} 
                  alt="Captura de pago" 
                  className="max-h-32 rounded-lg border border-white/10 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => openImageModal(getFullImageUrl(selectedPayment.screenshot!))}
                />
              </div>
            )}
            
            <div>
              <label className="block text-[10px] font-medium text-white/50 uppercase tracking-wider mb-2">
                Motivo del rechazo
              </label>
              <div className="space-y-2">
                {REJECTION_REASONS.map((reason) => (
                  <label 
                    key={reason.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedReason === reason.id 
                        ? 'bg-red-500/10 border border-red-500/25' 
                        : 'bg-white/5 border border-white/10 hover:border-white/20'
                    }`}
                  >
                    <input
                      type="radio"
                      name="rejection_reason"
                      value={reason.id}
                      checked={selectedReason === reason.id}
                      onChange={() => setSelectedReason(reason.id)}
                      className="accent-red-500"
                    />
                    <span className={`text-[11px] ${selectedReason === reason.id ? 'text-red-400 font-medium' : 'text-white/60'}`}>
                      {reason.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            
            {selectedReason === "other" && (
              <div>
                <label className="block text-[10px] font-medium text-white/50 uppercase tracking-wider mb-2">
                  Especificar motivo
                </label>
                <textarea
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/15 rounded-lg text-[12px] text-white/80 focus:outline-none focus:border-red-500/50 transition-all placeholder:text-white/30 resize-none"
                  placeholder="Escribe el motivo del rechazo..."
                  rows={3}
                  required
                />
              </div>
            )}
            
            {selectedReason && selectedReason !== "other" && (
              <div>
                <label className="block text-[10px] font-medium text-white/50 uppercase tracking-wider mb-2">
                  Notas adicionales (opcional)
                </label>
                <textarea
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/15 rounded-lg text-[12px] text-white/80 focus:outline-none focus:border-red-500/50 transition-all placeholder:text-white/30 resize-none"
                  placeholder="Información adicional..."
                  rows={2}
                />
              </div>
            )}
          </div>
          
          <div className="flex gap-3 px-6 py-4 border-t border-white/15 bg-white/5">
            <button
              onClick={onCloseReject}
              className="flex-1 px-4 py-2.5 border border-white/15 text-white/60 text-[11px] font-medium rounded-lg hover:bg-white/5 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={onRejectPayment}
              disabled={isRejecting || !selectedReason}
              className="flex-1 px-4 py-2.5 bg-red-500/15 text-red-400 text-[11px] font-medium rounded-lg hover:bg-red-500/25 disabled:opacity-50 transition-all border border-red-500/25"
            >
              {isRejecting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Rechazar Pago"}
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return null;
}