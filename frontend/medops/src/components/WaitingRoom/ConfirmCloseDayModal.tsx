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
      title="Cerrar Jornada"
      subtitle="Finalizar las operaciones del día"
      maxWidth="max-w-md"
    >
      <div className="space-y-5">
        <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[12px] font-medium text-white/80 leading-relaxed">
              ¿Está seguro de que desea finalizar la jornada? Esta acción marcará como 
              <span className="text-red-400 font-medium"> cancelados</span> a todos los pacientes que aún permanecen en cola.
            </p>
          </div>
        </div>
        
        <div className="bg-white/5 border border-white/15 p-3 rounded-lg">
          <p className="text-[10px] text-white/40 leading-relaxed">
            Nota: Los registros históricos no serán borrados, pero la sala de espera se reiniciará para el próximo ciclo.
          </p>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            className="flex-1 px-4 py-2.5 bg-red-500/15 text-red-400 text-[11px] font-medium rounded-lg hover:bg-red-500/25 transition-all border border-red-500/25"
            onClick={onConfirm}
          >
            Confirmar Cierre
          </button>
          <button
            className="px-6 py-2.5 border border-white/15 text-white/40 text-[11px] font-medium rounded-lg hover:bg-white/5 hover:text-white/70 transition-all"
            onClick={onCancel}
          >
            Cancelar
          </button>
        </div>
      </div>
    </EliteModal>
  );
};
export default ConfirmCloseDayModal;