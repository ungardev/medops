import React from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmGenericModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean; // Nueva prop para acciones de peligro
}

const ConfirmGenericModal: React.FC<ConfirmGenericModalProps> = ({
  title,
  message,
  confirmLabel = "Confirmar Acción",
  cancelLabel = "Abortar",
  onConfirm,
  onCancel,
  isDestructive = false,
}) => {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[1000] p-4 animate-in fade-in duration-300"
      onClick={onCancel}
    >
      {/* Backdrop con desenfoque profundo */}
      <div className="absolute inset-0 bg-[#0a0c10]/80 backdrop-blur-sm" />

      <div
        className="relative bg-[#11141a] border border-[var(--palantir-border)] shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Modal */}
        <div className="px-6 py-4 border-b border-[var(--palantir-border)] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className={`p-1.5 rounded-md ${isDestructive ? 'bg-red-500/10 text-red-500' : 'bg-[var(--palantir-active)]/10 text-[var(--palantir-active)]'}`}>
              <AlertTriangle size={18} />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">
              Confirmación de Sistema
            </h3>
          </div>
          <button 
            onClick={onCancel}
            className="text-[var(--palantir-muted)] hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="p-6">
          <h4 className="text-lg font-semibold text-white mb-2 leading-tight">
            {title}
          </h4>
          <p className="text-sm text-[var(--palantir-muted)] leading-relaxed">
            {message}
          </p>
        </div>

        {/* Acciones */}
        <div className="px-6 py-5 bg-white/[0.01] border-t border-[var(--palantir-border)] flex flex-row-reverse gap-3">
          <button
            className={`px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all shadow-lg ${
              isDestructive 
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/20' 
                : 'bg-[var(--palantir-active)] hover:bg-[var(--palantir-active)]/90 text-white shadow-blue-900/20'
            }`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
          
          <button
            className="px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest text-[var(--palantir-muted)] hover:text-white hover:bg-[var(--palantir-border)] transition-all border border-transparent hover:border-[var(--palantir-border)]"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
        </div>

        {/* Footer técnico sutil */}
        <div className="px-6 py-2 bg-black/20 flex justify-between items-center">
            <span className="text-[8px] font-mono text-[var(--palantir-muted)] uppercase tracking-tight">
              Auth_Required: Level_01
            </span>
            <div className="flex gap-1">
                <div className="w-1 h-1 rounded-full bg-[var(--palantir-muted)] opacity-30"></div>
                <div className="w-1 h-1 rounded-full bg-[var(--palantir-muted)] opacity-30"></div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmGenericModal;
