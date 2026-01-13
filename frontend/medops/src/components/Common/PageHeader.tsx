// src/components/Common/PageHeader.tsx
import React, { useEffect, useState, ReactNode } from "react";
import moment from "moment";
import { Link } from "react-router-dom";

interface PageStat {
  label: string;
  value: React.ReactNode; 
  color?: string; 
}

interface BreadcrumbItem {
  label: string;
  path?: string;
  active?: boolean;
}

interface PageHeaderProps {
  // Soporte para ambos estilos: string simple (legacy) o array de objetos (nuevo)
  breadcrumb?: string; 
  breadcrumbs?: BreadcrumbItem[];
  title: string;
  subtitle?: string;
  stats?: PageStat[];
  actions?: ReactNode;
  children?: ReactNode; // Para inyectar componentes personalizados como los contadores
}

const PageHeader: React.FC<PageHeaderProps> = ({ 
  breadcrumb, 
  breadcrumbs,
  title, 
  subtitle,
  stats, 
  actions,
  children 
}) => {
  const [now, setNow] = useState(moment());

  useEffect(() => {
    const timer = setInterval(() => setNow(moment()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative flex flex-col gap-4 mb-6 group animate-in fade-in slide-in-from-top-1 duration-700 select-none">
      
      {/* 1. TOP BAR: Metadatos de Sistema / Breadcrumbs */}
      <div className="flex items-center justify-between border-b border-[var(--palantir-border)]/20 pb-1.5">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--palantir-active)] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--palantir-active)] shadow-[0_0_8px_var(--palantir-active)]"></span>
          </div>
          
          {/* Lógica Dual para Breadcrumbs */}
          <nav className="flex items-center gap-1.5">
            {breadcrumbs ? (
              breadcrumbs.map((item, idx) => (
                <React.Fragment key={idx}>
                  {item.path ? (
                    <Link 
                      to={item.path} 
                      className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--palantir-muted)] hover:text-white transition-colors italic"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span className={`text-[9px] font-black uppercase tracking-[0.3em] italic ${item.active ? "text-white/80" : "text-[var(--palantir-muted)]"}`}>
                      {item.label}
                    </span>
                  )}
                  {idx < breadcrumbs.length - 1 && (
                    <span className="text-[8px] text-[var(--palantir-border)] opacity-50 font-mono">/</span>
                  )}
                </React.Fragment>
              ))
            ) : (
              <h2 className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--palantir-muted)] italic leading-none">
                {breadcrumb}
              </h2>
            )}
          </nav>
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
            {subtitle && (
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--palantir-muted)] opacity-60">
                    {subtitle}
                </p>
            )}
            <div className="w-16 h-[2px] bg-[var(--palantir-active)] shadow-[0_0_15px_var(--palantir-active)] transition-all group-hover/title:w-full duration-500" />
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

        {/* 4. CONTROL INTERFACE & CHILDREN (Aquí caen tus contadores de Sesión) */}
        {(actions || children) && (
          <div className="flex items-center gap-4 self-start lg:self-center p-2 bg-white/[0.02] border border-[var(--palantir-border)]/20 rounded-sm backdrop-blur-xl">
            {children}
            {actions}
          </div>
        )}
      </div>

      <div className="absolute -bottom-[2px] left-0 w-full h-[1px] bg-gradient-to-r from-[var(--palantir-active)] via-[var(--palantir-active)]/10 to-transparent opacity-40" />
    </section>
  );
};

export default PageHeader;
