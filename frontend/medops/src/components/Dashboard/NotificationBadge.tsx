// src/components/Common/NotificationBadge.tsx
import React from "react";

type AuditAction = "create" | "update" | "delete" | "other";

interface NotificationBadgeProps {
  action: AuditAction;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({ action }) => {
  const label =
    action === "create"
      ? "CREACIÓN"
      : action === "update"
      ? "ACTUALIZACIÓN"
      : action === "delete"
      ? "ELIMINACIÓN"
      : "EVENTO";

  const color =
    action === "create"
      ? "bg-green-600"
      : action === "update"
      ? "bg-yellow-500"
      : action === "delete"
      ? "bg-red-600"
      : "bg-[#0d2c53]";

  return (
    <span
      className={`inline-flex items-center justify-center px-2 py-[2px] text-[11px] rounded font-semibold text-white ${color}`}
    >
      {label}
    </span>
  );
};

export default NotificationBadge;
