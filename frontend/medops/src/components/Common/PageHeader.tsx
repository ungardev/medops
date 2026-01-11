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
    // Reducción de mb-10 a mb-6 y gap-6 a gap-4
    <section className="relative flex flex-col gap-4 mb-6 group animate-in fade-in slide-in-from-top-1 duration-700">
      
      {/* 1. TOP BAR: Metadatos de Sistema (Más compacta) */}
      <div className="flex items-center justify-between border-b border-[var(--palantir-border)]/20 pb-1.5">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--palantir-active)] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--palantir-active)] shadow-[0_0_8px_var(--palantir-active)]"></span>
          </div>
          
          <h2 className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--palantir-muted)] italic">
            {breadcrumb}
          </h2>
        </div>

        <div className="hidden sm:flex items-center gap-3 font-mono text-[8px] tracking-[0.2em] text-[var(--palantir-muted)]">
          <span className="opacity-40 uppercase">SYSTEM_CLOCK //</span>
          <span className="text-[var(--palantir-text)] font-bold">
            {now.format("YYYY-MM-DD HH:mm:ss").toUpperCase()}
          </span>
        </div>
      </div>

      {/* 2. MAIN CORE: Título y Acciones */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        <div className="flex flex-col gap-3">
          <div className="space-y-0.5">
            {/* Título más pequeño: de text-5xl a text-3xl/4xl */}
            <h1 className="text-3xl md:text-4xl font-black text-[var(--palantir-text)] tracking-tighter uppercase italic leading-none">
              {title}
            </h1>
            <div className="w-12 h-[2px] bg-[var(--palantir-active)] shadow-[0_0_10px_var(--palantir-active)]" />
          </div>

          {/* 3. ESTRUCTURA DE DATOS (Stats) */}
          {stats && stats.length > 0 && (
            <div className="flex flex-wrap items-center gap-0 border border-[var(--palantir-border)]/10 bg-black/10 backdrop-blur-sm rounded-sm overflow-hidden">
              {stats.map((stat, i) => (
                <div 
                  key={i} 
                  className={`flex flex-col px-4 py-1.5 min-w-[100px] ${
                    i !== 0 ? "border-l border-[var(--palantir-border)]/10" : ""
                  } hover:bg-[var(--palantir-active)]/5 transition-colors group/stat`}
                >
                  <span className="text-[7px] font-bold uppercase tracking-[0.2em] text-[var(--palantir-muted)] group-hover/stat:text-[var(--palantir-active)] transition-colors">
                    {stat.label}
                  </span>
                  <span className={`text-xs font-mono font-bold tracking-tight ${stat.color || "text-[var(--palantir-active)]"}`}>
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. CONTROL INTERFACE (Acciones) */}
        {actions && (
          <div className="flex items-center gap-2 self-start lg:self-center p-1.5 bg-[var(--palantir-border)]/5 border border-[var(--palantir-border)]/10 rounded-sm backdrop-blur-md">
            {actions}
          </div>
        )}
      </div>

      <div className="absolute -bottom-[1px] left-0 w-full h-[1px] bg-gradient-to-r from-[var(--palantir-active)] via-transparent to-transparent opacity-30" />
    </section>
  );
};

export default PageHeader;
