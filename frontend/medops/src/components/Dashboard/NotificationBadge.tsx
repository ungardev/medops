import React from "react";

type AuditAction = "create" | "update" | "delete" | "other";

interface NotificationBadgeProps {
  action: AuditAction;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({ action }) => {
  // 🔹 Etiquetas cortas para mobile/tablet; completas en desktop
  const short =
    action === "create" ? "CREAR" :
    action === "update" ? "EDITAR" :
    action === "delete" ? "BORRAR" : "EVENTO";

  const full =
    action === "create" ? "CREACIÓN" :
    action === "update" ? "ACTUALIZACIÓN" :
    action === "delete" ? "ELIMINACIÓN" : "EVENTO";

  const base =
    "inline-flex flex-none items-center justify-center max-w-[80px] md:max-w-[96px] lg:max-w-none overflow-hidden truncate px-2 py-[2px] text-xs rounded font-semibold text-white text-center leading-none";

  const color =
    action === "create" ? "bg-green-600" :
    action === "update" ? "bg-yellow-500" :
    action === "delete" ? "bg-red-600" : "bg-[#0d2c53]";

  return (
    <span className={`${base} ${color}`}>
      <span className="lg:hidden">{short}</span>
      <span className="hidden lg:inline">{full}</span>
    </span>
  );
};

export default NotificationBadge;
