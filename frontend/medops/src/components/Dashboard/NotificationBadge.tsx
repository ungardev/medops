import React from "react";

type AuditAction = "create" | "update" | "delete" | "other";

interface NotificationBadgeProps {
  action: AuditAction;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({ action }) => {
  let label = "";
  let className = "badge ";

  switch (action) {
    case "create":
      label = "CREACIÓN";
      className += "badge-success";
      break;
    case "update":
      label = "ACTUALIZACIÓN";
      className += "badge-warning";
      break;
    case "delete":
      label = "ELIMINACIÓN";
      className += "badge-danger";
      break;
    default:
      label = "EVENTO";
      className += "badge-info";
      break;
  }

  return <span className={className}>{label}</span>;
};

export default NotificationBadge;
