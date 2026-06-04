// src/components/Common/ConfirmGenericModal.tsx
import React from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import EliteModal from "./EliteModal";
interface ConfirmGenericModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
  open: boolean;
}
const ConfirmGenericModal: React.FC<ConfirmGenericModalProps> = ({
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
  onCancel,
  isDestructive = false,
  open,
}) => {
  return (
    <EliteModal 
      open={open} 
      onClose={onCancel} 
      title={isDestructive ? "Confirmar Acción" : "Confirmación"}
      maxWidth="max-w-md"
    >
      <div className="space-y-6">
        <div>
          <h4 className="text-base font-medium text-white/90 mb-2 leading-tight">
            {title}
          </h4>
          <p className="text-sm text-white/50 leading-relaxed">
            {message}
          </p>
        </div>
        
        <div className="flex gap-4">
          <button
            className={`px-6 py-3 rounded-xl text-sm font-medium transition-all ${
              isDestructive 
                ? 'bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/25' 
                : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/25'
            }`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
          
          <button
            className="px-6 py-3 rounded-xl text-sm font-medium text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </EliteModal>
  );
};
export default ConfirmGenericModal;