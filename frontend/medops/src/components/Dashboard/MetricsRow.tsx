// src/components/Dashboard/MetricsRow.tsx
import React from "react";
import { useDashboard } from "@/hooks/dashboard/useDashboard";
import { useDashboardFilters } from "@/context/DashboardFiltersContext";
import { metricsConfig } from "./metricsConfig";

const MetricsRow: React.FC = () => {
  // 🔹 Consumimos el contexto
  const { range, currency } = useDashboardFilters();

  // 🔹 Pasamos filtros al hook de datos
  const { metrics } = useDashboard({ range, currency });

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      {metrics &&
        Object.entries(metricsConfig).map(([key, cfg]) => {
          const Icon = cfg.icon;
          return (
            <div
              key={key}
              className="group relative rounded-sm bg-[var(--palantir-surface)] border border-[var(--palantir-border)] p-3 
                         flex flex-col items-start justify-center gap-1.5
                         hover:border-[var(--palantir-active)]/50 transition-all duration-200 cursor-pointer"
              onClick={() => {
                if (cfg.href) window.location.href = cfg.href;
              }}
            >
              {/* Decoración superior sutil al estilo Palantir */}
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--palantir-active)]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="flex items-center gap-2 w-full overflow-hidden">
                <div className={`p-1 rounded-[2px] bg-gray-500/5 ${cfg.color.replace('text-', 'text-opacity-80')}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--palantir-muted)] truncate">
                  {cfg.label}
                </span>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold tracking-tight text-[var(--palantir-text)] group-hover:text-[var(--palantir-active)] transition-colors font-mono">
                  {metrics[key as keyof typeof metrics] ?? 0}
                </span>
                {/* Opcional: Pequeño indicador de unidad o tendencia si existiera */}
                <span className="text-[9px] font-mono text-[var(--palantir-muted)] opacity-50 uppercase">
                  stat
                </span>
              </div>
            </div>
          );
        })}
    </div>
  );
};

export default MetricsRow;
