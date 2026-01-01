// src/components/Common/NotificationBadge.tsx
import React from "react";

export type AuditAction = "create" | "update" | "delete" | "other";
export type NotificationSeverity = "info" | "warning" | "critical";

interface NotificationBadgeProps {
  action: AuditAction;
  severity?: NotificationSeverity; // opcional, para colorear según importancia
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({ action, severity = "info" }) => {
  const label =
    action === "create"
      ? "CREACIÓN"
      : action === "update"
      ? "ACTUALIZACIÓN"
      : action === "delete"
      ? "ELIMINACIÓN"
      : "EVENTO";

  // 🔹 Color base por acción
  let baseColor =
    action === "create"
      ? "bg-green-600"
      : action === "update"
      ? "bg-yellow-500"
      : action === "delete"
      ? "bg-red-600"
      : "bg-[#0d2c53]";

  // 🔹 Ajuste por severidad
  if (severity === "warning") {
    baseColor = "bg-orange-500";
  } else if (severity === "critical") {
    baseColor = "bg-red-700";
  }

  return (
    <span
      className={`inline-flex items-center justify-center px-2 py-[2px] text-[11px] rounded font-semibold text-white ${baseColor}`}
    >
      {label}
    </span>
  );
};

export default NotificationBadge;
