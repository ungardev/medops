import React from "react";
import type { NotificationSeverity, AuditAction } from "@/types/notifications";
interface NotificationBadgeProps {
  action: AuditAction;
  severity?: NotificationSeverity;
}
const NotificationBadge: React.FC<NotificationBadgeProps> = ({ action, severity = "info" }) => {
  const label =
    action === "create" ? "NEW_DATA" : 
    action === "update" ? "MOD_DATA" : 
    action === "delete" ? "DEL_DATA" : "SYS_LOG";
  const styles: Record<string, string> = {
    create: "bg-emerald-500/5 text-emerald-500/80 border-emerald-500/20",
    update: "bg-amber-500/5 text-amber-500/80 border-amber-500/20",
    delete: "bg-red-500/5 text-red-500/80 border-red-500/20",
    other: "bg-blue-500/5 text-blue-500/80 border-blue-500/20",
    warning: "bg-orange-500/10 text-orange-400 border-orange-500/30",
    critical: "bg-red-600/20 text-red-500 border-red-600/40 animate-pulse font-black shadow-[0_0_10px_rgba(239,68,68,0.1)]",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  };
  const currentStyle = 
    severity && styles[severity] 
      ? styles[severity]
      : styles[action] || styles.other;
  return (
    <span
      className={`
        inline-flex items-center 
        px-1.5 py-0.5 
        text-[8px] font-mono font-black tracking-[0.1em]
        border rounded-[1px] 
        uppercase transition-all duration-300
        
      `}
    >
      <span className="w-1 h-1 rounded-full mr-1.5 bg-current opacity-60" />
      {label}
    </span>
  );
};
export default NotificationBadge;