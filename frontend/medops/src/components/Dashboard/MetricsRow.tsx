// src/components/Dashboard/MetricsRow.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDashboard } from "@/hooks/dashboard/useDashboard";
import { useDashboardFilters } from "@/context/DashboardFiltersContext";
import { metricsConfig } from "./metricsConfig";
const MetricsRow: React.FC = () => {
  const { range, currency } = useDashboardFilters();
  const { metrics } = useDashboard({ range, currency });
  const navigate = useNavigate();
  function formatValue(key: string, value: number): string {
    if (key.includes('revenue') || key.includes('total') || key.includes('income')) {
      return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: currency || 'MXN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    }
    return value.toLocaleString();
  }
  const handleMetricClick = (href?: string) => {
    if (href) {
      navigate(href);
    }
  };
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      {metrics &&
        Object.entries(metricsConfig).map(([key, cfg]) => {
          const Icon = cfg.icon;
          const value = metrics[key as keyof typeof metrics] ?? 0;
          return (
            <div
              key={key}
              onClick={() => handleMetricClick(cfg.href)}
              className="group relative rounded-sm bg-[#0c0e12] border border-white/[0.05] p-3 
                         flex flex-col items-start justify-center gap-1
                         hover:border-[var(--palantir-active)]/40 hover:bg-white/[0.02] 
                         transition-all duration-300 cursor-pointer overflow-hidden"
            >
              {/* Línea de acento superior estilo "Active Module" */}
              <div className="absolute top-0 left-0 w-full h-[2px] bg-[var(--palantir-active)] opacity-0 group-hover:opacity-100 transition-all duration-500 shadow-[0_0_8px_var(--palantir-active)]" />
              {/* Header de la Card */}
              <div className="flex items-center gap-2 w-full">
                <div className={`p-1 rounded-sm bg-white/[0.03] border border-white/5 ${cfg.color} group-hover:border-[var(--palantir-active)]/20 transition-colors`}>
                  <Icon className="h-3 w-3" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-[0.15em] text-white/40 group-hover:text-white/60 transition-colors truncate">
                  {cfg.label}
                </span>
              </div>
              {/* Valor Principal */}
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-lg font-mono font-bold tracking-tighter text-white group-hover:text-[var(--palantir-active)] transition-colors">
                  {formatValue(key, value)}
                </span>
              </div>
              {/* Metadatos de Pie de Card */}
              <div className="flex justify-between items-center w-full mt-1 pt-1 border-t border-white/[0.03]">
                <span className="text-[7px] font-mono text-white/20 uppercase tracking-tighter">
                  ID: {key.slice(0, 5)}
                </span>
                <div className="flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-emerald-500/50 animate-pulse"></div>
                  <span className="text-[7px] font-mono text-emerald-500/50 uppercase">Live</span>
                </div>
              </div>
              {/* Corner Decorator (Solo visible en hover) */}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[var(--palantir-active)]/5 rotate-45 translate-x-2 translate-y-2 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform"></div>
            </div>
          );
        })}
    </div>
  );
};
export default MetricsRow;