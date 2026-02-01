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
  confirmLabel = "EXECUTE_PROTOCOL",
  cancelLabel = "ABORT_OPERATION",
  onConfirm,
  onCancel,
  isDestructive = false,
  open,
}) => {
  return (
    <EliteModal 
      open={open} 
      onClose={onCancel} 
      title={isDestructive ? "DESTRUCTIVE_ACTION_CONFIRMATION" : "SYSTEM_CONFIRMATION_REQUIRED"}
      maxWidth="max-w-md"
      showDotIndicator={true}
    >
      <div className="space-y-6">
        {/* Mensaje con estilo elite */}
        <div>
          <h4 className="text-lg font-semibold text-white mb-2 leading-tight">
            {title}
          </h4>
          <p className="text-sm text-white/60 leading-relaxed">
            {message}
          </p>
        </div>
        
        {/* Botones elite */}
        <div className="flex gap-3">
          <button
            className={`px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
              isDestructive 
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/20' 
                : 'bg-white text-black hover:bg-white/90 shadow-black/20'
            }`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
          
          <button
            className="px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/5 transition-all border border-transparent hover:border-white/10"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
        </div>
        
        {/* Footer elite */}
        <div className="flex justify-between items-center pt-3 border-t border-white/5">
          <span className="text-[8px] font-mono text-white/40 uppercase tracking-tight">
            Auth_Required: Level_01
          </span>
          <div className="flex gap-1">
            <div className="w-1 h-1 rounded-full bg-white/40 opacity-30"></div>
            <div className="w-1 h-1 rounded-full bg-white/40 opacity-30"></div>
          </div>
        </div>
      </div>
    </EliteModal>
  );
};
export default ConfirmGenericModal;