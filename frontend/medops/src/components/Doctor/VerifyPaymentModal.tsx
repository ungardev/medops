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
// ✅ URL base del API para imágenes
const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000';
// ✅ Helper para obtener URL completa de imagen
const getFullImageUrl = (url: string | undefined): string => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};
// ✅ MOTIVOS PREDEFINIDOS DE RECHAZO
const REJECTION_REASONS = [
  { id: "wrong_amount", label: "Monto incorrecto - El monto no coincide con el esperado" },
  { id: "unreadable", label: "Captura ilegible - Favor subir una más clara" },
  { id: "invalid_ref", label: "Referencia no válida - Número de referencia incorrecto" },
  { id: "wrong_bank", label: "Banco destino incorrecto" },
  { id: "other", label: "Otro motivo" },
];
interface VerifyPaymentModalProps {
  // ✅ Modal: Confirmar y Agendar
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
  
  // ✅ Modal: Rechazar Pago
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
  
  // ✅ Modal: Confirmar y Agendar
  if (showConfirmAndScheduleModal && selectedPayment) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-[#0a0a0b] border border-white/10 w-full max-w-lg rounded-sm shadow-2xl my-auto max-h-[90vh] flex flex-col">
          
          {/* ✅ Header - Fijo */}
          <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              <CalendarIcon className="w-5 h-5 text-emerald-400" />
              <h3 className="text-white font-bold">Confirmar y Agendar</h3>
            </div>
            <button onClick={onCloseConfirmAndSchedule} className="text-white/50 hover:text-white">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          
          {/* ✅ Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <p className="text-sm text-white/60">
              Confirmar el pago de <span className="text-emerald-400 font-bold">
                Bs {Number(selectedPayment.amount_ves || 0).toLocaleString('es-VE')}
              </span> del paciente <span className="text-white font-bold">{selectedPayment.patient.full_name}</span> y agendar la cita.
            </p>
            
            {selectedPayment.screenshot && (
              <div>
                <p className="text-[10px] text-white/40 uppercase mb-2">Captura adjunta:</p>
                <img 
                  src={getFullImageUrl(selectedPayment.screenshot)} 
                  alt="Captura de pago" 
                  className="max-h-32 rounded-sm border border-white/10 cursor-pointer hover:opacity-80"
                  onClick={() => openImageModal(getFullImageUrl(selectedPayment.screenshot!))}
                />
              </div>
            )}
            
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase mb-2">
                Seleccionar Fecha Definitiva
              </label>
              <div className="bg-black/20 p-2 rounded border border-white/10">
                <SimpleCalendar
                  selectedDate={confirmAndScheduleDate}
                  onDateSelect={setConfirmAndScheduleDate}
                  serviceSchedules={[]}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase mb-2">
                Notas (opcional)
              </label>
              <textarea
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-sm text-white text-xs"
                placeholder="Agregar notas..."
                rows={2}
              />
            </div>
          </div>
          
          {/* ✅ Footer - Fijo */}
          <div className="flex gap-3 p-4 border-t border-white/10 bg-black/20 shrink-0">
            <button
              onClick={onCloseConfirmAndSchedule}
              className="flex-1 px-4 py-2.5 border border-white/20 text-white/60 text-xs font-bold uppercase rounded-sm hover:bg-white/5"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirmAndSchedule}
              disabled={!confirmAndScheduleDate || isConfirming}
              className="flex-1 px-4 py-2.5 bg-emerald-500 text-black text-xs font-bold uppercase rounded-sm hover:bg-emerald-400 disabled:opacity-50"
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
  
  // ✅ Modal: Rechazar Pago
  if (showRejectModal && selectedPayment) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-[#0a0a0b] border border-white/10 w-full max-w-md rounded-sm shadow-2xl my-auto max-h-[90vh] flex flex-col">
          
          {/* ✅ Header - Fijo */}
          <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              <XCircleIcon className="w-5 h-5 text-red-400" />
              <h3 className="text-white font-bold">Rechazar Pago</h3>
            </div>
            <button onClick={onCloseReject} className="text-white/50 hover:text-white">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          
          {/* ✅ Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <p className="text-sm text-white/60">
              ¿Rechazar el pago de <span className="text-red-400 font-bold">
                Bs {Number(selectedPayment.amount_ves || 0).toLocaleString('es-VE')}
              </span> del paciente <span className="text-white font-bold">{selectedPayment.patient.full_name}</span>?
            </p>
            
            {selectedPayment.screenshot && (
              <div>
                <p className="text-[10px] text-white/40 uppercase mb-2">Captura adjunta:</p>
                <img 
                  src={getFullImageUrl(selectedPayment.screenshot)} 
                  alt="Captura de pago" 
                  className="max-h-32 rounded-sm border border-white/10 cursor-pointer hover:opacity-80"
                  onClick={() => openImageModal(getFullImageUrl(selectedPayment.screenshot!))}
                />
              </div>
            )}
            
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase mb-2">
                Motivo del rechazo
              </label>
              <div className="space-y-2">
                {REJECTION_REASONS.map((reason) => (
                  <label 
                    key={reason.id}
                    className={`flex items-center gap-3 p-3 rounded-sm cursor-pointer transition-colors ${
                      selectedReason === reason.id 
                        ? 'bg-red-500/10 border border-red-500/30' 
                        : 'bg-black/20 border border-white/5 hover:border-white/10'
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
                    <span className={`text-[10px] ${selectedReason === reason.id ? 'text-red-400 font-bold' : 'text-white/60'}`}>
                      {reason.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            
            {selectedReason === "other" && (
              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase mb-2">
                  Especificar motivo
                </label>
                <textarea
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-sm text-white text-xs"
                  placeholder="Escribe el motivo del rechazo..."
                  rows={3}
                  required
                />
              </div>
            )}
            
            {selectedReason && selectedReason !== "other" && (
              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase mb-2">
                  Notas adicionales (opcional)
                </label>
                <textarea
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-sm text-white text-xs"
                  placeholder="Información adicional..."
                  rows={2}
                />
              </div>
            )}
          </div>
          
          {/* ✅ Footer - Fijo */}
          <div className="flex gap-3 p-4 border-t border-white/10 bg-black/20 shrink-0">
            <button
              onClick={onCloseReject}
              className="flex-1 px-4 py-2.5 border border-white/20 text-white/60 text-xs font-bold uppercase rounded-sm hover:bg-white/5"
            >
              Cancelar
            </button>
            <button
              onClick={onRejectPayment}
              disabled={isRejecting || !selectedReason}
              className="flex-1 px-4 py-2.5 bg-red-500 text-white text-xs font-bold uppercase rounded-sm hover:bg-red-400 disabled:opacity-50"
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