import React, { ReactNode } from "react";
import { X } from "lucide-react";

interface ModalShellProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
};

export default function ModalShell({ open, onClose, title, children, footer, size = "2xl" }: ModalShellProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`relative w-full ${sizeClasses[size]} bg-[#0a0a0f] border border-white/10 rounded-xl shadow-2xl max-h-[90vh] flex flex-col`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/40 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {children}
        </div>
        {footer && (
          <div className="px-6 py-4 border-t border-white/10 flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
