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
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={() => !isPending && onClose()}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--palantir-active)]">
            Confirm_Session_Termination
          </h2>
          <button
            onClick={onClose}
            disabled={isPending}
            className="p-1 hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
        {/* Session Info */}
        <div className="p-4 border-b border-white/5 bg-white/[0.02]">
          <div className="grid grid-cols-2 gap-4 text-[10px] font-mono">
            <div>
              <span className="text-[var(--palantir-muted)] uppercase">Session_ID</span>
              <p className="text-white font-bold">SESS-{sessionId.toString().padStart(4, '0')}</p>
            </div>
            <div>
              <span className="text-[var(--palantir-muted)] uppercase">Patient</span>
              <p className="text-white font-bold truncate">{patientName}</p>
            </div>
            <div className="col-span-2">
              <span className="text-[var(--palantir-muted)] uppercase">Duration</span>
              <p className="text-emerald-400 font-bold flex items-center gap-2">
                <ClockIcon className="w-3 h-3" />
                <SessionTimer startTime={startedAt} />
              </p>
            </div>
          </div>
        </div>
        {/* Session Summary */}
        <div className="p-4 space-y-3">
          <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--palantir-muted)]">
            Session_Summary
          </h3>
          
          <div className="grid grid-cols-2 gap-2">
            {/* Diagnoses */}
            <div className="p-3 bg-white/[0.03] border border-white/5">
              <div className="flex items-center gap-2 mb-1">
                <BeakerIcon className="w-3 h-3 text-blue-400" />
                <span className="text-[8px] font-black uppercase tracking-widest text-[var(--palantir-muted)]">Diagnoses</span>
              </div>
              <p className="text-lg font-black text-blue-400">{diagnosesCount}</p>
            </div>
            {/* Treatments */}
            <div className="p-3 bg-white/[0.03] border border-white/5">
              <div className="flex items-center gap-2 mb-1">
                <DocumentTextIcon className="w-3 h-3 text-purple-400" />
                <span className="text-[8px] font-black uppercase tracking-widest text-[var(--palantir-muted)]">Treatments</span>
              </div>
              <p className="text-lg font-black text-purple-400">{treatmentsCount}</p>
            </div>
            {/* Billing */}
            <div className="p-3 bg-white/[0.03] border border-white/5">
              <div className="flex items-center gap-2 mb-1">
                <CurrencyDollarIcon className="w-3 h-3 text-amber-400" />
                <span className="text-[8px] font-black uppercase tracking-widest text-[var(--palantir-muted)]">Billing</span>
              </div>
              <p className="text-lg font-black text-amber-400">${billingTotal.toFixed(2)}</p>
              <p className={`text-[9px] font-mono ${isPaid ? 'text-emerald-400' : 'text-red-400'}`}>
                {isPaid ? 'PAID' : `$${billingPending.toFixed(2)} pending`}
              </p>
            </div>
            {/* Documents */}
            <div className="p-3 bg-white/[0.03] border border-white/5">
              <div className="flex items-center gap-2 mb-1">
                <DocumentTextIcon className="w-3 h-3 text-emerald-400" />
                <span className="text-[8px] font-black uppercase tracking-widest text-[var(--palantir-muted)]">Documents</span>
              </div>
              <p className="text-lg font-black text-emerald-400">{documentsCount}</p>
            </div>
          </div>
          {/* Warning */}
          <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20">
            <CheckCircleIcon className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-[9px] font-mono text-amber-300/80">
              This action will mark the session as <span className="font-bold">COMPLETED</span> and cannot be undone.
            </p>
          </div>
        </div>
        {/* Actions */}
        <div className="flex gap-2 p-4 border-t border-white/10 bg-white/[0.02]">
          <button
            onClick={onClose}
            disabled={isPending}
            className="flex-1 py-2 text-[10px] font-black uppercase tracking-widest border border-white/20 text-white hover:bg-white/5 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 py-2 text-[10px] font-black uppercase tracking-widest bg-blue-600 text-white hover:bg-blue-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Finalizing...
              </>
            ) : (
              "Commit_Session"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}