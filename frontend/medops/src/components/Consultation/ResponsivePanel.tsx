// src/components/Consultation/ResponsivePanel.tsx
import { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
interface ResponsivePanelProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}
export default function ResponsivePanel({
  title,
  children,
  defaultExpanded = false,
}: ResponsivePanelProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  return (
    <div className="lg:hidden border border-white/15 bg-white/5 overflow-hidden mb-3 rounded-lg transition-all duration-200">
      <div 
        onClick={() => setExpanded(!expanded)}
        className={`flex items-center justify-between px-4 py-3 cursor-pointer select-none transition-colors ${
          expanded ? "bg-white/10 border-b border-white/15" : "bg-transparent"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-1 h-4 rounded-full transition-colors ${expanded ? "bg-emerald-400" : "bg-white/20"}`} />
          <h4 className="text-[12px] font-semibold text-white">
            {title}
          </h4>
        </div>
        
        <button
          className="text-white/50 hover:text-white transition-colors"
          aria-label={expanded ? "Contraer" : "Expandir"}
        >
          {expanded ? (
            <ChevronUpIcon className="w-5 h-5" />
          ) : (
            <ChevronDownIcon className="w-5 h-5" />
          )}
        </button>
      </div>
      {expanded && (
        <div className="px-4 py-4 animate-in slide-in-from-top-2 duration-300">
          {children}
        </div>
      )}
    </div>
  );
}