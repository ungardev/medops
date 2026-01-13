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
  breadcrumb?: string; 
  breadcrumbs?: BreadcrumbItem[];
  title: string;
  subtitle?: string;
  stats?: PageStat[];
  actions?: ReactNode;
  children?: ReactNode; 
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
    <section className="relative flex flex-col gap-4 mb-8 group animate-in fade-in slide-in-from-top-1 duration-700 select-none">
      
      {/* 1. TOP BAR: Metadatos de Sistema / Breadcrumbs con Vida */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-3">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--palantir-active)] opacity-40"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--palantir-active)] shadow-[0_0_10px_var(--palantir-active)]"></span>
          </div>
          
          <nav className="flex items-center gap-2">
            {breadcrumbs ? (
              breadcrumbs.map((item, idx) => (
                <React.Fragment key={idx}>
                  {item.path ? (
                    <Link 
                      to={item.path} 
                      className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40 hover:text-[var(--palantir-active)] hover:drop-shadow-[0_0_8px_rgba(var(--palantir-active-rgb),0.5)] transition-all duration-300 italic"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span className={`text-[10px] font-black uppercase tracking-[0.25em] italic ${item.active ? "text-white/90 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" : "text-white/30"}`}>
                      {item.label}
                    </span>
                  )}
                  {idx < breadcrumbs.length - 1 && (
                    <span className="text-[9px] text-white/10 font-mono font-bold">/</span>
                  )}
                </React.Fragment>
              ))
            ) : (
              <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-white/60 italic leading-none">
                {breadcrumb}
              </h2>
            )}
          </nav>
        </div>

        <div className="hidden sm:flex items-center gap-4 font-mono text-[9px] tracking-[0.15em]">
          <span className="text-white/20 uppercase">Core_Link_Active</span>
          <span className="text-white/80 font-bold tabular-nums bg-white/5 px-2 py-0.5 rounded-sm border border-white/10">
            {now.format("HH:mm:ss").toUpperCase()} <span className="text-white/30 ml-1">{now.format("ZZ")}</span>
          </span>
        </div>
      </div>

      {/* 2. MAIN CORE: Título y Subtítulo con Contraste */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        
        <div className="flex flex-col gap-2">
          <div className="relative medops-scanning group/title">
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic leading-none relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
              {title}
            </h1>
            {subtitle && (
                <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[var(--palantir-active)] opacity-80 mt-1">
                    {subtitle}
                </p>
            )}
            <div className="w-20 h-[3px] bg-[var(--palantir-active)] shadow-[0_0_20px_var(--palantir-active)] mt-2 transition-all group-hover/title:w-full duration-700 ease-out" />
          </div>

          {/* 3. ESTRUCTURA DE DATOS (Stats) Refinada */}
          {stats && stats.length > 0 && (
            <div className="flex flex-wrap items-center gap-0 border border-white/10 bg-white/[0.02] backdrop-blur-xl rounded-sm overflow-hidden mt-2 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              {stats.map((stat, i) => (
                <div 
                  key={i} 
                  className={`flex flex-col px-6 py-3 min-w-[130px] relative border-r border-white/5 last:border-r-0 hover:bg-white/[0.03] transition-all group/stat`}
                >
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/30 group-hover/stat:text-white/60 transition-colors">
                    {stat.label}
                  </span>
                  <div className={`text-sm font-mono font-black tracking-widest ${stat.color || "text-white"} drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]`}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. CONTROL INTERFACE & CHILDREN */}
        {(actions || children) && (
          <div className="flex items-center gap-4 self-start lg:self-center p-3 bg-white/5 border border-white/10 rounded-sm backdrop-blur-2xl shadow-inner">
            <div className="flex items-center gap-3">
               {children}
            </div>
            {actions && (
              <>
                <div className="w-[1px] h-8 bg-white/10 mx-1" />
                <div className="flex items-center gap-2">
                   {actions}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Línea de base decorativa táctica */}
      <div className="absolute -bottom-4 left-0 w-full flex items-center gap-2 opacity-20">
         <div className="h-[1px] flex-1 bg-gradient-to-r from-[var(--palantir-active)] to-transparent" />
         <div className="text-[7px] font-mono text-white/40 tracking-[0.5em]">MEDOPZ_OS_V2.6</div>
      </div>
    </section>
  );
};

export default PageHeader;
