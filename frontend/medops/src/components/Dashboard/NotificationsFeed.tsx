// src/components/Dashboard/NotificationsFeed.tsx
import { useState, useEffect } from "react";
import { useNotifications } from "@/hooks/dashboard/useNotifications";
import { NotificationEvent } from "@/types/notifications";
import moment from "moment";
import AppointmentDetail from "@/components/Appointments/AppointmentDetail";
import { useAppointment } from "@/hooks/appointments/useAppointments";
import NotificationBadge from "@/components/Dashboard/NotificationBadge";

function toArray<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === "object" && Array.isArray((raw as any).results)) {
    return (raw as any).results as T[];
  }
  return [];
}

function AppointmentDetailWrapper({ appointmentId, onClose }: { appointmentId: number; onClose: () => void; }) {
  const { data: appointment, isLoading, isError } = useAppointment(appointmentId);

  if (isLoading) return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <p className="text-sm text-[var(--palantir-text)] italic">Sincronizando cita...</p>
    </div>
  );

  if (isError || !appointment) return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[var(--palantir-surface)] p-6 border border-red-500/50 rounded-md text-center">
        <p className="text-sm text-red-500 mb-4">Error en la carga del registro</p>
        <button onClick={onClose} className="px-4 py-2 bg-[var(--palantir-border)] text-[var(--palantir-text)] text-xs rounded uppercase font-bold">Cerrar</button>
      </div>
    </div>
  );

  return <AppointmentDetail appointment={appointment} onClose={onClose} onEdit={() => onClose()} />;
}

export default function NotificationsFeed() {
  const { data, isLoading, refetch } = useNotifications();
  const [selectedChargeOrder, setSelectedChargeOrder] = useState<number | null>(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => refetch(), 500);
    return () => clearTimeout(timeout);
  }, [refetch]);

  // Limitamos a 3 notificaciones
  const notifications = toArray<NotificationEvent>(data).slice(0, 3);

  const handleAction = (n: NotificationEvent) => {
    if (n.category?.startsWith("appointment") && n.entity_id) setSelectedAppointmentId(n.entity_id);
    else if (n.category?.startsWith("payment") && n.entity_id) setSelectedChargeOrder(n.entity_id);
    else if (n.action_href) window.location.href = n.action_href;
  };

  return (
    /* Eliminamos h-full y flex-col innecesario para que el borde cierre al final del contenido */
    <div className="bg-[var(--palantir-surface)] border border-[var(--palantir-border)] rounded-lg shadow-sm overflow-hidden self-start">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-[var(--palantir-border)] bg-[var(--palantir-bg)]/30 flex justify-between items-center">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--palantir-muted)]">Actividad Reciente</h3>
        <span className="text-[9px] text-[var(--palantir-active)] font-bold animate-pulse">● LIVE</span>
      </div>

      <div className="p-2">
        <ul className="space-y-0.5">
          {isLoading ? (
            <li className="p-4 text-center text-xs text-[var(--palantir-muted)] italic font-mono">SYNCING...</li>
          ) : notifications.length === 0 ? (
            <li className="p-4 text-center text-xs text-[var(--palantir-muted)] italic">Sin eventos recientes</li>
          ) : (
            notifications.map((n) => (
              <li key={n.id}>
                <button
                  onClick={() => handleAction(n)}
                  className="w-full text-left p-2 rounded-md transition-all flex flex-col gap-0.5 hover:bg-[var(--palantir-active)]/5 group"
                >
                  <div className="flex items-center gap-2">
                    <NotificationBadge
                      action={n.badge_action as any}
                      severity={n.severity}
                    />
                    <span className="truncate text-xs font-bold text-[var(--palantir-text)] uppercase tracking-tight group-hover:text-[var(--palantir-active)] transition-colors">
                      {n.title}
                    </span>
                  </div>
                  {n.description && (
                    <span className="text-[11px] text-[var(--palantir-muted)] line-clamp-1 ml-6">
                      {n.description}
                    </span>
                  )}
                  <span className="text-[9px] font-mono text-[var(--palantir-muted)]/50 uppercase ml-6">
                    {moment(n.timestamp).fromNow()}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Modales */}
      {selectedAppointmentId && (
        <AppointmentDetailWrapper
          appointmentId={selectedAppointmentId}
          onClose={() => setSelectedAppointmentId(null)}
        />
      )}
    </div>
  );
}
