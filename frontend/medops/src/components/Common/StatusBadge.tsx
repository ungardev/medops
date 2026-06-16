import React from "react";

export interface StatusConfig {
  label: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

const DEFAULT_CONFIG: StatusConfig = {
  label: "Desconocido",
  bgClass: "bg-white/5",
  textClass: "text-white/40",
  borderClass: "border-white/10",
};

export const SURGERY_STATUS_CONFIGS: Record<string, StatusConfig> = {
  scheduled: { label: "Programada", bgClass: "bg-blue-500/10", textClass: "text-blue-400", borderClass: "border-blue-500/20" },
  pre_op: { label: "Pre-operatorio", bgClass: "bg-amber-500/10", textClass: "text-amber-400", borderClass: "border-amber-500/20" },
  in_progress: { label: "En Curso", bgClass: "bg-purple-500/10", textClass: "text-purple-400", borderClass: "border-purple-500/20" },
  completed: { label: "Completada", bgClass: "bg-emerald-500/10", textClass: "text-emerald-400", borderClass: "border-emerald-500/20" },
  canceled: { label: "Cancelada", bgClass: "bg-red-500/10", textClass: "text-red-400", borderClass: "border-red-500/20" },
  postponed: { label: "Pospuesta", bgClass: "bg-gray-500/10", textClass: "text-gray-400", borderClass: "border-gray-500/20" },
};

export const HOSPITALIZATION_STATUS_CONFIGS: Record<string, StatusConfig> = {
  admitted: { label: "Admitido", bgClass: "bg-blue-500/10", textClass: "text-blue-400", borderClass: "border-blue-500/20" },
  stable: { label: "Estable", bgClass: "bg-emerald-500/10", textClass: "text-emerald-400", borderClass: "border-emerald-500/20" },
  critical: { label: "Crítico", bgClass: "bg-red-500/10", textClass: "text-red-400", borderClass: "border-red-500/20" },
  improving: { label: "En Mejoría", bgClass: "bg-amber-500/10", textClass: "text-amber-400", borderClass: "border-amber-500/20" },
  awaiting_discharge: { label: "Esperando Alta", bgClass: "bg-purple-500/10", textClass: "text-purple-400", borderClass: "border-purple-500/20" },
  discharged: { label: "Dado de Alta", bgClass: "bg-gray-500/10", textClass: "text-gray-400", borderClass: "border-gray-500/20" },
  transferred: { label: "Transferido", bgClass: "bg-blue-500/10", textClass: "text-blue-400", borderClass: "border-blue-500/20" },
  deceased: { label: "Fallecido", bgClass: "bg-red-900/20", textClass: "text-red-500", borderClass: "border-red-900/30" },
};

export const RISK_LEVEL_CONFIGS: Record<string, StatusConfig> = {
  low: { label: "Bajo Riesgo", bgClass: "bg-emerald-500/10", textClass: "text-emerald-400", borderClass: "border-emerald-500/20" },
  moderate: { label: "Riesgo Moderado", bgClass: "bg-amber-500/10", textClass: "text-amber-400", borderClass: "border-amber-500/20" },
  high: { label: "Alto Riesgo", bgClass: "bg-orange-500/10", textClass: "text-orange-400", borderClass: "border-orange-500/20" },
  critical: { label: "Crítico", bgClass: "bg-red-500/10", textClass: "text-red-400", borderClass: "border-red-500/20" },
};

interface StatusBadgeProps {
  status: string;
  configs: Record<string, StatusConfig>;
  displayLabel?: string;
  className?: string;
}

export default function StatusBadge({ status, configs, displayLabel, className = "" }: StatusBadgeProps) {
  const config = configs[status] || DEFAULT_CONFIG;
  const label = displayLabel || config.label;

  return (
    <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-md border ${config.bgClass} ${config.textClass} ${config.borderClass} ${className}`}>
      {label}
    </span>
  );
}
