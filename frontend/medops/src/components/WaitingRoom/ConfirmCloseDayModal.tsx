// src/components/WaitingRoom/ConfirmCloseDayModal.tsx
import React from "react";
import { ExclamationTriangleIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface ConfirmCloseDayModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmCloseDayModal: React.FC<ConfirmCloseDayModalProps> = ({ onConfirm, onCancel }) => {
  return (
    <div
      className="fixed inset-0 bg-[var(--palantir-bg)]/90 backdrop-blur-md flex items-center justify-center z-[110] p-4"
      onClick={onCancel}
    >
      <div
        className="bg-[var(--palantir-surface)] border border-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.1)] p-0 max-w-md w-full rounded-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header de Advertencia */}
        <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-red-500">
              SYSTEM_TERMINAL_SHUTDOWN
            </h3>
          </div>
          <button onClick={onCancel} className="text-red-500/50 hover:text-red-500 transition-colors">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <p className="text-[11px] font-bold text-[var(--palantir-muted)] uppercase tracking-widest">
              Confirmar Cierre de Jornada
            </p>
            <p className="text-sm text-[var(--palantir-text)] leading-relaxed font-medium">
              ¿Está seguro de que desea finalizar la sesión operativa? Esta acción marcará como <span className="text-red-400 font-mono">ABORTED</span> a todos los pacientes que aún permanecen en cola.
            </p>
          </div>

          <div className="bg-[var(--palantir-bg)]/50 border border-[var(--palantir-border)]/50 p-3 rounded-sm">
            <p className="text-[9px] font-mono text-[var(--palantir-muted)] italic">
              Nota: Los registros históricos no serán borrados, pero la sala de espera actual se reiniciará para el próximo ciclo.
            </p>
          </div>
        </div>

        {/* Acciones */}
        <div className="px-6 py-4 bg-[var(--palantir-bg)]/30 border-t border-[var(--palantir-border)]/30 flex gap-3">
          <button
            className="flex-1 px-4 py-2.5 bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.1em] rounded-sm hover:bg-red-500 transition-all shadow-lg shadow-red-900/20"
            onClick={onConfirm}
          >
            CONFIRMAR_CIERRE
          </button>
          <button
            className="px-6 py-2.5 border border-[var(--palantir-border)] text-[var(--palantir-muted)] text-[10px] font-black uppercase tracking-[0.1em] rounded-sm hover:bg-[var(--palantir-surface)] hover:text-white transition-all"
            onClick={onCancel}
          >
            ABORTAR
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmCloseDayModal;
