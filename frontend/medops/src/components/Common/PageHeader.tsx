import React, { useEffect, useState } from "react";
import moment from "moment";

interface PageStat {
  label: string;
  value: string | number;
  color?: string; 
}

interface PageHeaderProps {
  breadcrumb: string;
  title: string;
  stats?: PageStat[];
  actions?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ 
  breadcrumb, 
  title, 
  stats, 
  actions 
}) => {
  const [now, setNow] = useState(moment());

  useEffect(() => {
    const timer = setInterval(() => setNow(moment()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative flex flex-col gap-6 mb-10 group animate-in fade-in slide-in-from-top-2 duration-700">
      
      {/* 1. TOP BAR: Metadatos de Sistema */}
      <div className="flex items-center justify-between border-b border-[var(--palantir-border)]/30 pb-2">
        <div className="flex items-center gap-3">
          {/* Indicador de Estado Activo */}
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--palantir-active)] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--palantir-active)] shadow-[0_0_8px_var(--palantir-active)]"></span>
          </div>
          
          <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--palantir-muted)] italic">
            {breadcrumb}
          </h2>
        </div>

        {/* Telemetría Temporal (Reloj Institucional) */}
        <div className="hidden sm:flex items-center gap-4 font-mono text-[9px] tracking-[0.2em] text-[var(--palantir-muted)]">
          <span className="opacity-50 uppercase">System_Clock //</span>
          <span className="text-[var(--palantir-text)] font-bold">
            {now.format("YYYY-MM-DD HH:mm:ss").toUpperCase()}
          </span>
        </div>
      </div>

      {/* 2. MAIN CORE: Título y Acciones */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        
        <div className="flex flex-col gap-4">
          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl font-black text-[var(--palantir-text)] tracking-tighter uppercase italic leading-none">
              {title}
            </h1>
            {/* Sub-línea de acento dinámico */}
            <div className="w-16 h-[3px] bg-[var(--palantir-active)] shadow-[0_0_10px_var(--palantir-active)]" />
          </div>

          {/* 3. ESTRUCTURA DE DATOS (Stats): Celdas de Información */}
          {stats && stats.length > 0 && (
            <div className="flex flex-wrap items-center gap-0 border border-[var(--palantir-border)]/20 bg-black/10 backdrop-blur-sm rounded-sm overflow-hidden">
              {stats.map((stat, i) => (
                <div 
                  key={i} 
                  className={`flex flex-col px-5 py-2 min-w-[120px] ${
                    i !== 0 ? "border-l border-[var(--palantir-border)]/20" : ""
                  } hover:bg-[var(--palantir-active)]/5 transition-colors group/stat`}
                >
                  <span className="text-[8px] font-bold uppercase tracking-[0.25em] text-[var(--palantir-muted)] group-hover/stat:text-[var(--palantir-active)] transition-colors">
                    {stat.label}
                  </span>
                  <span className={`text-sm font-mono font-bold tracking-tight ${stat.color || "text-[var(--palantir-active)]"}`}>
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. CONTROL INTERFACE (Acciones) */}
        {actions && (
          <div className="flex items-center gap-3 self-start lg:self-end p-2 bg-[var(--palantir-border)]/5 border border-[var(--palantir-border)]/10 rounded-sm backdrop-blur-md">
            {actions}
          </div>
        )}
      </div>

      {/* Acento final de esquina (Look de Interfaz de Misión) */}
      <div className="absolute -bottom-[2px] left-0 w-full h-[1px] bg-gradient-to-r from-[var(--palantir-active)] via-transparent to-transparent opacity-40" />
    </section>
  );
};

export default PageHeader;
