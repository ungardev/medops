// src/components/Common/EliteModal.tsx
import React from "react";
import ReactDOM from "react-dom";
import { XMarkIcon } from "@heroicons/react/24/outline";
interface EliteModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  maxWidth?: string;
  children: React.ReactNode;
}
const EliteModal: React.FC<EliteModalProps> = ({ 
  open, 
  onClose, 
  title, 
  subtitle,
  maxWidth = "max-w-lg", 
  children,
}) => {
  if (!open) return null;
  
  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[999] p-4" onClick={onClose}>
      <div 
        className={`bg-[#1a1a1b] border border-white/15 shadow-2xl w-full ${maxWidth} rounded-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
          <div>
            <h2 className="text-[12px] font-semibold text-white/80">
              {title}
            </h2>
            {subtitle && (
              <p className="text-[10px] text-white/50 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded-lg">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-5">
          {children}
        </div>
      </div>
    </div>,
    document.getElementById("modal-root")!
  );
};
export default EliteModal;