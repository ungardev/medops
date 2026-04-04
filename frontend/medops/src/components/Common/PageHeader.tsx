// src/components/Common/PageHeader.tsx
import React, { useEffect, useState, ReactNode } from "react";
import moment from "moment";
import { Link, useLocation } from "react-router-dom";
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
  const location = useLocation();
  const isPatientRoute = location.pathname.startsWith("/patient");
  const homePath = isPatientRoute ? "/patient" : "/";
  
  useEffect(() => {
    const timer = setInterval(() => setNow(moment()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <section className="relative flex flex-col gap-5 mb-6 animate-in fade-in slide-in-from-top-1 duration-500">
      
      {/* Breadcrumbs y Reloj */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <nav className="flex" aria-label="Breadcrumb">
          <ol role="list" className="flex items-center space-x-2">
            <li>
              <Link to={homePath} className="text-white/50 hover:text-white transition-colors">
                <HomeIcon className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Inicio</span>
              </Link>
            </li>
            
            {breadcrumbs ? (
              breadcrumbs.map((item, idx) => (
                <li key={idx}>
                  <div className="flex items-center">
                    <ChevronRightIcon
                      className="h-4 w-4 flex-shrink-0 text-white/30"
                      aria-hidden="true"
                    />
                    {item.path ? (
                      <Link
                        to={item.path}
                        className="ml-2 text-[12px] font-medium text-white/60 hover:text-white transition-colors"
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <span
                        className={`ml-2 text-[12px] font-semibold ${
                          item.active ? "text-white" : "text-white/60"
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
                  <ChevronRightIcon className="h-4 w-4 flex-shrink-0 text-white/30" aria-hidden="true" />
                  <h2 className="ml-2 text-[12px] font-semibold text-white/80">
                    {breadcrumb}
                  </h2>
                </div>
              </li>
            )}
          </ol>
        </nav>
        
        <div className="hidden sm:flex items-center gap-3 text-[12px] text-white/50">
          <span className="font-medium">{now.format("HH:mm:ss")}</span>
          <span className="text-white/30">•</span>
          <span>{now.format("DD MMM YYYY")}</span>
        </div>
      </div>
      
      {/* Stats y Acciones */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        
        {stats && stats.length > 0 ? (
          <div className="flex flex-wrap items-center gap-4">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="flex flex-col px-4 py-2 min-w-[120px] hover:bg-white/5 rounded-lg transition-colors"
              >
                <span className="text-[10px] font-medium text-white/50 uppercase tracking-wider">
                  {stat.label}
                </span>
                <div className={`text-[16px] font-semibold mt-0.5 ${stat.color || "text-white"}`}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1" />
        )}
        
        {(actions || children) && (
          <div className="flex items-center gap-3 self-start lg:self-center">
            {children && (
              <div className="flex items-center gap-2">
                {children}
              </div>
            )}
            
            {actions && (
              <>
                {children && <div className="w-[1px] h-6 bg-white/10" />}
                <div className="flex items-center gap-2">
                  {actions}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
export default PageHeader;