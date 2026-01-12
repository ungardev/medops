// src/components/Common/PageHeader.tsx
import React, { useEffect, useState } from "react";
import moment from "moment";

interface PageStat {
  label: string;
  value: React.ReactNode; // Cambiado de string | number para soportar componentes dinámicos
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
    <section className="relative flex flex-col gap-4 mb-6 group animate-in fade-in slide-in-from-top-1 duration-700 select-none">
      
      {/* 1. TOP BAR: Metadatos de Sistema */}
      <div className="flex items-center justify-between border-b border-[var(--palantir-border)]/20 pb-1.5">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--palantir-active)] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--palantir-active)] shadow-[0_0_8px_var(--palantir-active)]"></span>
          </div>
          
          <h2 className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--palantir-muted)] italic leading-none">
            {breadcrumb}
          </h2>
        </div>

        <div className="hidden sm:flex items-center gap-3 font-mono text-[8px] tracking-[0.2em] text-[var(--palantir-muted)]">
          <span className="opacity-40 uppercase animate-pulse">System_Live //</span>
          <span className="text-[var(--palantir-text)] font-bold tabular-nums">
            {now.format("YYYY-MM-DD HH:mm:ss").toUpperCase()}
          </span>
        </div>
      </div>

      {/* 2. MAIN CORE */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        <div className="flex flex-col gap-3">
          <div className="relative space-y-0.5 medops-scanning group/title">
            <h1 className="text-3xl md:text-4xl font-black text-[var(--palantir-text)] tracking-tighter uppercase italic leading-none relative z-10">
              {title}
            </h1>
            <div className="w-16 h-[2px] bg-[var(--palantir-active)] shadow-[0_0_15px_var(--palantir-active)] transition-all group-hover/title:w-full duration-500" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--palantir-active)]/5 to-transparent -skew-x-12 translate-x-[-100%] group-hover/title:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
          </div>

          {/* 3. ESTRUCTURA DE DATOS (Stats) */}
          {stats && stats.length > 0 && (
            <div className="flex flex-wrap items-center gap-0 border border-[var(--palantir-border)]/10 bg-black/20 backdrop-blur-md rounded-sm overflow-hidden shadow-2xl">
              {stats.map((stat, i) => (
                <div 
                  key={i} 
                  className={`flex flex-col px-5 py-2 min-w-[110px] relative ${
                    i !== 0 ? "border-l border-[var(--palantir-border)]/10" : ""
                  } hover:bg-[var(--palantir-active)]/[0.03] transition-all group/stat`}
                >
                  <span className="text-[7px] font-black uppercase tracking-[0.2em] text-[var(--palantir-muted)] group-hover/stat:text-[var(--palantir-active)] transition-colors">
                    {stat.label}
                  </span>
                  <div className={`text-xs font-mono font-black tracking-widest ${stat.color || "text-[var(--palantir-active)]"} drop-shadow-[0_0_5px_currentColor]`}>
                    {stat.value}
                  </div>
                  <div className="absolute top-0 right-0 w-1 h-1 border-t border-r border-[var(--palantir-active)] opacity-0 group-hover/stat:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. CONTROL INTERFACE */}
        {actions && (
          <div className="flex items-center gap-2 self-start lg:self-center p-2 bg-white/[0.02] border border-[var(--palantir-border)]/20 rounded-sm backdrop-blur-xl shadow-[inner_0_0_20px_rgba(0,0,0,0.5)]">
            {actions}
          </div>
        )}
      </div>

      <div className="absolute -bottom-[2px] left-0 w-full h-[1px] bg-gradient-to-r from-[var(--palantir-active)] via-[var(--palantir-active)]/10 to-transparent opacity-40" />
    </section>
  );
};

export default PageHeader;
