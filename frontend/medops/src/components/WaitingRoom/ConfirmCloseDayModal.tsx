// src/components/WaitingRoom/ConfirmCloseDayModal.tsx
import React from "react";
import EliteModal from "../Common/EliteModal";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
interface ConfirmCloseDayModalProps {
  onConfirm: () => void;
  onCancel: () => void;
  open?: boolean;
}
const ConfirmCloseDayModal: React.FC<ConfirmCloseDayModalProps> = ({ 
  onConfirm, 
  onCancel, 
  open = true 
}) => {
  return (
    <EliteModal
      open={open}
      onClose={onCancel}
      title="SYSTEM_TERMINAL_SHUTDOWN"
      subtitle="DAILY_OPERATIONS_CLOSURE"
      maxWidth="max-w-md"
      showDotIndicator={true}
    >
      {/* Header con tema rojo de advertencia */}
      <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-red-500">
            SYSTEM_TERMINAL_SHUTDOWN
          </h3>
        </div>
      </div>
      {/* Contenido - CSS Variables convertidas a Elite */}
      <div className="p-6 space-y-4">
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-white/60 uppercase tracking-widest">
            Confirmar Cierre de Jornada
          </p>
          <p className="text-sm text-white leading-relaxed font-medium">
            ¿Está seguro de que desea finalizar la sesión operativa? Esta acción marcará como 
            <span className="text-red-400 font-mono">ABORTED</span> a todos los pacientes que aún permanecen en cola.
          </p>
        </div>
        <div className="bg-black/50 border border-white/10 p-3 rounded-sm">
          <p className="text-[9px] font-mono text-white/40 italic">
            Nota: Los registros históricos no serán borrados, pero la sala de espera actual se reiniciará para el próximo ciclo.
          </p>
        </div>
      </div>
      {/* Acciones - Convertidas a estándar Elite */}
      <div className="px-6 py-4 bg-black/30 border-t border-white/10 flex gap-3">
        <button
          className="flex-1 px-4 py-2.5 bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.1em] rounded-sm hover:bg-red-500 transition-all shadow-lg shadow-red-900/20"
          onClick={onConfirm}
        >
          CONFIRMAR_CIERRE
        </button>
        <button
          className="px-6 py-2.5 border border-white/10 text-white/60 text-[10px] font-black uppercase tracking-[0.1em] rounded-sm hover:bg-white/5 hover:text-white transition-all"
          onClick={onCancel}
        >
          ABORTAR
        </button>
      </div>
    </EliteModal>
  );
};
export default ConfirmCloseDayModal;