// src/components/Common/PageHeader.tsx
import React from "react";

/**
 * Interface para las estadísticas rápidas del header
 */
interface PageStat {
  label: string;
  value: string | number;
  color?: string; // Clase de Tailwind para el color del valor (ej: "text-emerald-500")
}

interface PageHeaderProps {
  /** Texto del micro-breadcrumb (ej: "MEDOPS // OPS_CENTRAL // SALA_ESPERA") */
  breadcrumb: string;
  /** Título principal de la página */
  title: string;
  /** Array opcional de métricas clave para visualización rápida */
  stats?: PageStat[];
  /** Nodo opcional para botones o controles de acción */
  actions?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ 
  breadcrumb, 
  title, 
  stats, 
  actions 
}) => {
  return (
    <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--palantir-border)]/20 pb-4 mb-6 animate-in fade-in slide-in-from-top-1 duration-500">
      
      <div className="space-y-1">
        {/* 1. Micro-Breadcrumb Estilo Palantir */}
        <div className="flex items-center gap-2">
          <div className="w-1 h-1 bg-[var(--palantir-active)] rounded-full animate-pulse shadow-[0_0_5px_var(--palantir-active)]" />
          <h2 className="text-[9px] font-black uppercase tracking-[0.35em] text-[var(--palantir-muted)] leading-none opacity-80 italic">
            {breadcrumb}
          </h2>
        </div>

        {/* 2. Título y Métricas Inline */}
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-6">
          <h1 className="text-2xl font-bold text-[var(--palantir-text)] tracking-tight">
            {title}
          </h1>
          
          {stats && stats.length > 0 && (
            <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-[var(--palantir-border)]/30 pt-2 sm:pt-0 sm:pl-6">
              {stats.map((stat, i) => (
                <div key={i} className="flex flex-col">
                  <span className="text-[8px] font-bold uppercase tracking-widest text-[var(--palantir-muted)] leading-tight">
                    {stat.label}
                  </span>
                  <span className={`text-xs font-mono font-bold ${stat.color || "text-[var(--palantir-active)]"}`}>
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Slot de Acciones (Botones, Selectores, etc.) */}
      {actions && (
        <div className="flex items-center gap-2 self-start md:self-end">
          {actions}
        </div>
      )}
    </section>
  );
};

export default PageHeader;
