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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[200]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[var(--palantir-active)]/20 border-t-[var(--palantir-active)] rounded-full animate-spin" />
        <p className="text-[10px] text-white/40 font-mono uppercase tracking-[0.2em]">Synchronizing_Register...</p>
      </div>
    </div>
  );
  if (isError || !appointment) return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[200]">
      <div className="bg-[#0c0e12] p-6 border border-red-500/30 rounded-sm text-center shadow-2xl">
        <p className="text-[10px] font-mono text-red-500 mb-4 uppercase tracking-widest">Error_in_Data_Node_Load</p>
        <button onClick={onClose} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-[9px] rounded-sm uppercase font-black tracking-widest transition-all">Abort</button>
      </div>
    </div>
  );
  return <AppointmentDetail appointment={appointment} onClose={onClose} onEdit={() => onClose()} />;
}
export default function NotificationsFeed() {
  const { data, isLoading, refetch } = useNotifications();
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);
  useEffect(() => {
    const timeout = setTimeout(() => refetch(), 500);
    return () => clearTimeout(timeout);
  }, [refetch]);
  const notifications = toArray<NotificationEvent>(data).slice(0, 3);
  const handleAction = (n: NotificationEvent) => {
    if (n.category?.startsWith("appointment") && n.entity_id) setSelectedAppointmentId(n.entity_id);
    else if (n.action_href) window.location.href = n.action_href;
  };
  return (
    <div className="bg-[#0c0e12] border border-white/[0.05] rounded-sm shadow-2xl overflow-hidden self-start group">
      {/* Header Estilo Consola */}
      <div className="px-4 py-2 border-b border-white/[0.05] bg-white/[0.02] flex justify-between items-center group-hover:bg-white/[0.04] transition-colors">
        <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">Activity_Stream</h3>
        <div className="flex items-center gap-2">
            <span className="text-[8px] text-[var(--palantir-active)] font-black tracking-tighter opacity-80 uppercase italic">Real-Time</span>
            <span className="w-1.5 h-1.5 bg-[var(--palantir-active)] rounded-full animate-pulse shadow-[0_0_5px_var(--palantir-active)]" />
        </div>
      </div>
      <div className="p-1.5">
        <ul className="space-y-1">
          {isLoading ? (
            <li className="p-8 text-center text-[9px] text-white/20 italic font-mono tracking-widest animate-pulse">FETCHING_DATA_STREAM...</li>
          ) : notifications.length === 0 ? (
            <li className="p-8 text-center text-[9px] text-white/20 italic font-mono uppercase tracking-widest underline decoration-white/5 underline-offset-4">Null_Event_Log</li>
          ) : (
            notifications.map((n) => (
              <li key={n.id}>
                <button
                  onClick={() => handleAction(n)}
                  className="w-full text-left p-2.5 rounded-sm transition-all flex flex-col gap-1 hover:bg-white/[0.03] border border-transparent hover:border-white/[0.05] group/item"
                >
                  <div className="flex items-center gap-2">
                    <NotificationBadge
                      action={n.badge_action as any}
                      severity={n.severity ?? "info" as any}
                    />
                    <span className="truncate text-[10px] font-black text-white/80 uppercase tracking-tight group-hover/item:text-[var(--palantir-active)] transition-colors">
                      {n.title}
                    </span>
                  </div>
                  {n.description && (
                    <span className="text-[10px] text-white/30 line-clamp-1 ml-0 font-medium">
                      {n.description}
                    </span>
                  )}
                  <div className="flex justify-between items-center mt-1">
                      <span className="text-[8px] font-mono text-white/10 uppercase font-black">
                        {moment(n.timestamp).fromNow()}
                      </span>
                      <span className="text-[7px] font-mono text-[var(--palantir-active)] opacity-0 group-hover/item:opacity-100 transition-opacity">EXECUTE_ACTION →</span>
                  </div>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
