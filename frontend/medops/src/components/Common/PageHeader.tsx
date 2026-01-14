// src/components/Common/PageHeader.tsx
import React, { useEffect, useState, ReactNode } from "react";
import moment from "moment";
import { Link } from "react-router-dom";
import { ChevronRightIcon, HomeIcon } from "@heroicons/react/20/solid";

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
  stats?: PageStat[];
  actions?: ReactNode;
  children?: ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  breadcrumb,
  breadcrumbs,
  stats,
  actions,
  children,
}) => {
  const [now, setNow] = useState(moment());

  useEffect(() => {
    const timer = setInterval(() => setNow(moment()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative flex flex-col gap-6 mb-8 group animate-in fade-in slide-in-from-top-1 duration-700 select-none">
      
      {/* 1. TOP BAR: Breadcrumbs (Elite Navigation) & System Clock */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-4">
          <div className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-40"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"></span>
          </div>

          <nav className="flex" aria-label="Breadcrumb">
            <ol role="list" className="flex items-center space-x-2">
              <li>
                <div>
                  <Link to="/" className="text-white/30 hover:text-white transition-colors">
                    <HomeIcon className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                    <span className="sr-only">Home</span>
                  </Link>
                </div>
              </li>
              
              {breadcrumbs ? (
                breadcrumbs.map((item, idx) => (
                  <li key={idx}>
                    <div className="flex items-center">
                      <ChevronRightIcon
                        className="h-4 w-4 flex-shrink-0 text-white/40" // Chevron ahora es claramente visible
                        aria-hidden="true"
                      />
                      {item.path ? (
                        <Link
                          to={item.path}
                          className="ml-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-white transition-all duration-300"
                        >
                          {item.label}
                        </Link>
                      ) : (
                        <span
                          className={`ml-2 text-[10px] font-black uppercase tracking-[0.2em] ${
                            item.active
                              ? "text-white/90 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                              : "text-white/30"
                          }`}
                          aria-current={item.active ? "page" : undefined}
                        >
                          {item.label}
                        </span>
                      )}
                    </div>
                  </li>
                ))
              ) : (
                <li>
                  <div className="flex items-center">
                    <ChevronRightIcon className="h-4 w-4 flex-shrink-0 text-white/40" aria-hidden="true" />
                    <h2 className="ml-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/60 leading-none">
                      {breadcrumb}
                    </h2>
                  </div>
                </li>
              )}
            </ol>
          </nav>
        </div>

        {/* System Clock - Refined */}
        <div className="hidden sm:flex items-center gap-4 font-mono text-[9px] tracking-[0.15em]">
          <span className="text-white/20 uppercase tracking-[0.3em]">System_Clock</span>
          <span className="text-white/80 font-bold tabular-nums bg-white/5 px-2 py-0.5 rounded-sm border border-white/10">
            {now.format("HH:mm:ss").toUpperCase()} <span className="text-white/30 ml-1">{now.format("ZZ")}</span>
          </span>
        </div>
      </div>

      {/* 2. OPERATIONAL CORE: Stats & Actions (Layout simplificado) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        
        {/* Statistics Section */}
        {stats && stats.length > 0 ? (
          <div className="flex flex-wrap items-center gap-0 border border-white/5 bg-black/20 backdrop-blur-md rounded-sm overflow-hidden shadow-xl">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="flex flex-col px-6 py-2.5 min-w-[130px] relative border-r border-white/5 last:border-r-0 hover:bg-white/[0.03] transition-all group/stat"
              >
                <span className="text-[8px] font-black uppercase tracking-[0.25em] text-white/20 group-hover/stat:text-white/40 transition-colors">
                  {stat.label}
                </span>
                <div className={`text-[12px] font-mono font-black tracking-[0.1em] mt-0.5 ${stat.color || "text-white"} drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]`}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1" /> // Spacer si no hay stats
        )}

        {/* Control Interface: Actions & Children (Buttons suben aquí) */}
        {(actions || children) && (
          <div className="flex items-center gap-4 self-start lg:self-center p-1.5 bg-black/40 border border-white/5 rounded-sm backdrop-blur-xl shadow-2xl">
            {children && (
              <div className="flex items-center gap-3 px-2">
                {children}
              </div>
            )}
            
            {actions && (
              <>
                {children && <div className="w-[1px] h-6 bg-white/10 mx-1" />}
                <div className="flex items-center gap-2">
                  {actions}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Decorative Tactical Baseline */}
      <div className="absolute -bottom-6 left-0 w-full flex items-center gap-3 opacity-20 pointer-events-none">
        <div className="h-[1px] flex-1 bg-gradient-to-r from-white/40 to-transparent" />
        <div className="text-[7px] font-mono text-white/40 tracking-[0.8em] uppercase">Medopz_Protocol_Terminal</div>
      </div>
    </section>
  );
};

export default PageHeader;
