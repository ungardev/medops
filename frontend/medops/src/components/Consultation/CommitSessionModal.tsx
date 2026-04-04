// src/components/Consultation/CommitSessionModal.tsx
import { useEffect } from "react";
import { XMarkIcon, ClockIcon, DocumentTextIcon, BeakerIcon, CurrencyDollarIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
interface CommitSessionModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
  sessionId: number;
  patientName: string;
  startedAt: string | null;
  diagnosesCount: number;
  treatmentsCount: number;
  billingTotal: number;
  billingPending: number;
  documentsCount: number;
}
const SessionTimer = ({ startTime }: { startTime: string | null }) => {
  const elapsed = calculateElapsed(startTime);
  return <span className="font-mono tabular-nums">{elapsed}</span>;
};
function calculateElapsed(startTime: string | null): string {
  if (!startTime) return "N/A";
  const start = new Date(startTime).getTime();
  const now = new Date().getTime();
  if (isNaN(start)) return "N/A";
  const diff = Math.max(0, now - start);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return h > 0 
    ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
export default function CommitSessionModal({
  open,
  onClose,
  onConfirm,
  isPending,
  sessionId,
  patientName,
  startedAt,
  diagnosesCount,
  treatmentsCount,
  billingTotal,
  billingPending,
  documentsCount,
}: CommitSessionModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPending) onClose();
    };
    if (open) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, isPending, onClose]);
  if (!open) return null;
  const isPaid = billingPending <= 0;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={() => !isPending && onClose()}
      />
      
      <div className="relative w-full max-w-lg bg-[#1a1a1b] border border-white/15 rounded-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-white/15">
          <h2 className="text-[12px] font-semibold text-white">
            Confirmar Finalización de Sesión
          </h2>
          <button
            onClick={onClose}
            disabled={isPending}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 border-b border-white/10 bg-white/5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] font-medium text-white/50 uppercase">ID Sesión</span>
              <p className="text-[12px] font-semibold text-white">#{sessionId.toString().padStart(4, '0')}</p>
            </div>
            <div>
              <span className="text-[10px] font-medium text-white/50 uppercase">Paciente</span>
              <p className="text-[12px] font-semibold text-white truncate">{patientName}</p>
            </div>
            <div className="col-span-2">
              <span className="text-[10px] font-medium text-white/50 uppercase">Duración</span>
              <p className="text-[12px] font-semibold text-emerald-400 flex items-center gap-2">
                <ClockIcon className="w-4 h-4" />
                <SessionTimer startTime={startedAt} />
              </p>
            </div>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <h3 className="text-[10px] font-medium text-white/50 uppercase tracking-wider">
            Resumen de Sesión
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <BeakerIcon className="w-4 h-4 text-blue-400" />
                <span className="text-[10px] font-medium text-white/60">Diagnósticos</span>
              </div>
              <p className="text-xl font-semibold text-blue-400">{diagnosesCount}</p>
            </div>
            <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <DocumentTextIcon className="w-4 h-4 text-purple-400" />
                <span className="text-[10px] font-medium text-white/60">Tratamientos</span>
              </div>
              <p className="text-xl font-semibold text-purple-400">{treatmentsCount}</p>
            </div>
            <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CurrencyDollarIcon className="w-4 h-4 text-amber-400" />
                <span className="text-[10px] font-medium text-white/60">Facturación</span>
              </div>
              <p className="text-xl font-semibold text-amber-400">${billingTotal.toFixed(2)}</p>
              <p className={`text-[10px] font-medium mt-0.5 ${isPaid ? 'text-emerald-400' : 'text-red-400'}`}>
                {isPaid ? 'Pagado' : `$${billingPending.toFixed(2)} pendiente`}
              </p>
            </div>
            <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <DocumentTextIcon className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] font-medium text-white/60">Documentos</span>
              </div>
              <p className="text-xl font-semibold text-emerald-400">{documentsCount}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <CheckCircleIcon className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-300/80 leading-relaxed">
              Esta acción marcará la sesión como <span className="font-semibold">completada</span> y no se puede deshacer.
            </p>
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-white/10 bg-white/5">
          <button
            onClick={onClose}
            disabled={isPending}
            className="flex-1 py-2.5 text-[11px] font-medium border border-white/15 text-white/70 hover:bg-white/5 transition-all disabled:opacity-50 rounded-lg"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 py-2.5 text-[11px] font-medium bg-blue-500 text-white hover:bg-blue-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2 rounded-lg"
          >
            {isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Finalizando...
              </>
            ) : (
              "Completar Sesión"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}