import React, { ReactNode } from "react";
import { X } from "lucide-react";

interface DrawerShellProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  accentColor?: "emerald" | "blue" | "purple";
}

const accentClasses = {
  emerald: "border-emerald-500/20 text-emerald-400",
  blue: "border-blue-500/20 text-blue-400",
  purple: "border-purple-500/20 text-purple-400",
};

export default function DrawerShell({ open, onClose, title, children, footer, accentColor = "emerald" }: DrawerShellProps) {
  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed right-0 top-0 h-full w-full max-w-xl bg-[#0a0a0f] border-l border-white/10 z-50 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className={`text-lg font-semibold ${accentClasses[accentColor]}`}>{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/40 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {children}
        </div>
        {footer && (
          <div className="px-6 py-4 border-t border-white/10">
            {footer}
          </div>
        )}
      </div>
    </>
  );
}
