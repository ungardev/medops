// src/components/Dashboard/NotificationBadge.tsx
import React from "react";

export type AuditAction = "create" | "update" | "delete" | "other";
export type NotificationSeverity = "info" | "warning" | "critical";

interface NotificationBadgeProps {
  action: AuditAction;
  severity?: NotificationSeverity;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({ action, severity = "info" }) => {
  // Labels optimizados para un look de sistema operativo clínico
  const label =
    action === "create"
      ? "REGISTRO"
      : action === "update"
      ? "CAMBIO"
      : action === "delete"
      ? "BORRADO"
      : "EVENTO";

  // Mapeo de estilos técnicos (Fondo traslúcido + Texto vibrante + Borde sutil)
  const styles: Record<string, string> = {
    create: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    update: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    delete: "bg-red-500/10 text-red-400 border-red-500/20",
    other: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    warning: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    critical: "bg-red-600/20 text-red-500 border-red-600/40 animate-pulse font-bold shadow-[0_0_10px_rgba(239,68,68,0.2)]",
  };

  // Lógica de jerarquía: la severidad manda sobre la acción
  const currentStyle = (severity === "critical" || severity === "warning") 
    ? styles[severity] 
    : styles[action] || styles.other;

  return (
    <span
      className={`
        inline-flex items-center 
        px-2 py-0.5 
        text-[9px] font-mono tracking-[0.15em]
        border rounded-sm 
        uppercase transition-all duration-300
        ${currentStyle}
      `}
    >
      {/* Indicador LED lateral */}
      <span className="w-1 h-1 rounded-full mr-1.5 bg-current animate-pulse opacity-80" />
      {label}
    </span>
  );
};

export default NotificationBadge;
