// src/components/Consultation/ResponsivePanel.tsx
import { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon } from "@heroicons/react/24/outline";

interface ResponsivePanelProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

/**
 * ResponsivePanel
 * - Mobile/Tablet: Acordeón con estética industrial.
 * - Desktop (lg:): Se mantiene oculto porque en Desktop usamos el Grid estático.
 */
export default function ResponsivePanel({
  title,
  children,
  defaultExpanded = false,
}: ResponsivePanelProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="lg:hidden border border-[var(--palantir-border)] bg-black/10 overflow-hidden mb-2 transition-all duration-200">
      {/* Header con estética de "Módulo de Sistema" */}
      <div 
        onClick={() => setExpanded(!expanded)}
        className={`flex items-center justify-between px-4 py-3 cursor-pointer select-none transition-colors ${
          expanded ? "bg-white/10 border-b border-[var(--palantir-border)]" : "bg-transparent"
        }`}
      >
        <div className="flex items-center gap-3">
          {/* Indicador visual de estado */}
          <div className={`w-1 h-3 transition-colors ${expanded ? "bg-[var(--palantir-active)] shadow-[0_0_8px_var(--palantir-active)]" : "bg-white/20"}`} />
          <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--palantir-text)]">
            {title}
          </h4>
        </div>
        
        <div className="flex items-center gap-2">
          {expanded ? (
            <span className="text-[8px] font-mono text-[var(--palantir-active)] uppercase mr-2 animate-pulse">Active_View</span>
          ) : (
            <span className="text-[8px] font-mono text-[var(--palantir-muted)] uppercase mr-2">Collapsed</span>
          )}
          
          <button
            className="text-[var(--palantir-muted)] group-hover:text-[var(--palantir-text)]"
            aria-label={expanded ? "Contraer" : "Expandir"}
          >
            {expanded ? (
              <ArrowsPointingInIcon className="w-4 h-4" />
            ) : (
              <ArrowsPointingOutIcon className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Contenido con transición suave */}
      {expanded && (
        <div className="px-4 py-4 animate-in slide-in-from-top-2 duration-300">
          {children}
        </div>
      )}
    </div>
  );
}
