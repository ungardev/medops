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
  showDotIndicator?: boolean;
}
const EliteModal: React.FC<EliteModalProps> = ({ 
  open, 
  onClose, 
  title, 
  subtitle,
  maxWidth = "max-w-lg", 
  children,
  showDotIndicator = true 
}) => {
  if (!open) return null;
  
  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[999] p-4" onClick={onClose}>
      <div 
        className={`bg-[#0a0a0a] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full ${maxWidth} rounded-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header del Modal Elite */}
        <div className="px-4 py-3 border-b border-white/5 bg-white/5 flex justify-between items-center">
          <div className="flex items-center gap-2">
            {showDotIndicator && (
              <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
            )}
            <div>
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70">
                {title}
              </h2>
              {subtitle && (
                <p className="text-[9px] font-mono text-white/40 uppercase tracking-widest mt-1">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
        
        {/* Content del Modal */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>,
    document.getElementById("modal-root")!
  );
};
export default EliteModal;