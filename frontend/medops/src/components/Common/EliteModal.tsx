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
  showDotIndicator,
}) => {
  if (!open) return null;
  
  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[999] p-5" onClick={onClose}>
      <div 
        className={`bg-[#1a1a1b] border border-white/15 shadow-2xl w-full ${maxWidth} rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-white/10 bg-white/5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {showDotIndicator && (
              <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
            )}
            <div>
              <h2 className="text-base font-semibold text-white/90">
                {title}
              </h2>
              {subtitle && (
                <p className="text-sm text-white/50 mt-1">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>,
    document.getElementById("modal-root")!
  );
};
export default EliteModal;