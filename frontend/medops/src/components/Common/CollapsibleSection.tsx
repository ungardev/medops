import React, { useState, ReactNode } from "react";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
interface CollapsibleSectionProps {
  title: string;
  icon: ReactNode; // Cambiado a ReactNode
  color: string;
  children: ReactNode;
  defaultExpanded?: boolean;
  className?: string;
}
export default function CollapsibleSection({
  title,
  icon,
  color,
  children,
  defaultExpanded = true,
  className = "",
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  // Determinar el color CSS variable o color directo
  const getColorStyle = () => {
    if (color.startsWith("var(")) {
      return { color: `var(--palantir-active)` };
    }
    return { color: color };
  };
  return (
    <section className={`relative ${className}`}>
      {/* Línea decorativa lateral (solo en expanded) */}
      {isExpanded && (
        <div 
          className="absolute -left-4 top-0 h-full w-0.5 hidden lg:block" 
          style={{ backgroundColor: color.startsWith("var(") ? `var(--palantir-active)` : color }}
        />
      )}
      {/* Header colapsable */}
      <div 
        className="flex items-center gap-3 mb-4 cursor-pointer group"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Contenedor del ícono */}
        <div 
          className={`p-1.5 rounded-sm transition-colors ${
            color.startsWith("var(") ? `bg-[var(--palantir-active)]/10` : `bg-${color}/10`
          }`}
          style={color.startsWith("var(") ? undefined : { backgroundColor: `${color}15` }}
        >
          {/* Renderizar ícono directamente sin cloneElement */}
          <div className={`w-4 h-4 ${color.startsWith("var(") ? 'text-[var(--palantir-active)]' : ''}`} style={getColorStyle()}>
            {icon}
          </div>
        </div>
        
        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${
          color.startsWith("var(") ? 'text-[var(--palantir-active)]' : `text-[${color}]`
        }`}>
          {title}
        </span>
        
        <div className="flex-1 h-[1px] bg-gradient-to-r from-[var(--palantir-border)] to-transparent" />
        
        {/* Indicador de expansión */}
        <div className={`p-1 rounded-sm transition-colors ${isExpanded ? 'bg-white/5' : 'group-hover:bg-white/5'}`}>
          {isExpanded ? (
            <ChevronDownIcon className="w-3 h-3 text-[var(--palantir-muted)]" />
          ) : (
            <ChevronRightIcon className="w-3 h-3 text-[var(--palantir-muted)]" />
          )}
        </div>
      </div>
      {/* Contenido colapsable */}
      {isExpanded && (
        <div className="pl-2 lg:pl-4 animate-in fade-in slide-in-from-top-2">
          {children}
        </div>
      )}
    </section>
  );
}