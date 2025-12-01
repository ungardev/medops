import React from "react";

type AuditAction = "create" | "update" | "delete" | "other";

interface NotificationBadgeProps {
  action: AuditAction;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({ action }) => {
  let label = "";
  let className =
    "inline-block px-2 py-0.5 text-xs rounded font-semibold text-white";

  switch (action) {
    case "create":
      label = "CREACIÓN";
      className += " bg-green-600";
      break;
    case "update":
      label = "ACTUALIZACIÓN";
      className += " bg-yellow-500";
      break;
    case "delete":
      label = "ELIMINACIÓN";
      className += " bg-red-600";
      break;
    default:
      label = "EVENTO";
      className += " bg-[#0d2c53]";
      break;
  }

  return <span className={className}>{label}</span>;
};

export default NotificationBadge;
