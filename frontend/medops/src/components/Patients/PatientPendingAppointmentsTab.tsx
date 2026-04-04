// src/components/Patients/PatientPendingAppointmentsTab.tsx
import { PatientTabProps } from "./types";
import { usePendingAppointments } from "../../hooks/patients/usePendingAppointments";
import { Appointment } from "../../types/appointments";
import { CalendarDaysIcon, ClockIcon, ChatBubbleBottomCenterTextIcon } from "@heroicons/react/24/outline";
export default function PatientPendingAppointmentsTab({ patient }: PatientTabProps) {
  const { data: appointments, isLoading, error } = usePendingAppointments(patient.id);
  const isEmpty = !isLoading && !error && (appointments?.length ?? 0) === 0;
  if (isLoading) return (
    <div className="flex items-center gap-3 p-6 text-[11px] text-white/40 animate-pulse">
      <div className="w-2 h-2 bg-emerald-400 rounded-full" />
      Cargando citas programadas...
    </div>
  );
  if (error) return (
    <div className="p-4 border border-red-500/20 bg-red-500/5 text-red-400 text-[11px] rounded-lg">
      Error al acceder al calendario: {(error as Error).message}
    </div>
  );
  if (isEmpty) return (
    <div className="p-8 border border-dashed border-white/15 rounded-lg text-center">
      <p className="text-[11px] text-white/40">
        No hay citas programadas
      </p>
    </div>
  );
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <CalendarDaysIcon className="w-5 h-5 text-emerald-400" />
          <h3 className="text-[12px] font-semibold text-white">
            Citas Programadas
          </h3>
        </div>
        <span className="text-[10px] text-white/40">
          {appointments?.length} pendiente{appointments?.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="hidden sm:block overflow-hidden border border-white/15 rounded-lg bg-white/5">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/15">
              <th className="px-4 py-3 text-[10px] font-medium text-white/50 uppercase tracking-wider">Fecha</th>
              <th className="px-4 py-3 text-[10px] font-medium text-white/50 uppercase tracking-wider">Tipo</th>
              <th className="px-4 py-3 text-[10px] font-medium text-white/50 uppercase tracking-wider">Estado</th>
              <th className="px-4 py-3 text-[10px] font-medium text-white/50 uppercase tracking-wider">Notas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {appointments?.map((a: Appointment) => {
              const isActive = a.status === 'arrived' || a.status === 'in_consultation';
              
              return (
                <tr key={a.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-medium text-white">
                        {new Date(a.appointment_date).toLocaleDateString("es-VE", { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                      <span className="text-[9px] text-white/40 italic">
                        {getTimeRemaining(a.appointment_date)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2.5 py-1 border border-emerald-500/20 uppercase font-medium rounded-md">
                      {a.appointment_type === 'general' ? 'General' : a.appointment_type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isActive ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                      <span className="text-[10px] text-white/60">
                        {a.status === 'pending' ? 'Pendiente' : a.status === 'arrived' ? 'Confirmada' : a.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-[10px] text-white/40 max-w-xs truncate group-hover:whitespace-normal">
                      {a.notes || "—"}
                    </p>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="sm:hidden space-y-3">
        {appointments?.map((a: Appointment) => (
          <div key={a.id} className="p-4 bg-white/5 border border-white/15 rounded-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-15">
              <ClockIcon className="w-8 h-8 text-emerald-400" />
            </div>
            <div className="mb-3">
              <p className="text-[12px] font-medium text-white">
                {new Date(a.appointment_date).toLocaleDateString("es-VE", { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <p className="text-[9px] text-emerald-400/60 italic">
                {getTimeRemaining(a.appointment_date)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-3">
              <div className="flex flex-col">
                <span className="text-[8px] text-white/40 uppercase">Tipo</span>
                <span className="text-[10px] text-white/70 font-medium">{a.appointment_type === 'general' ? 'General' : a.appointment_type}</span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-[8px] text-white/40 uppercase">Estado</span>
                <span className="text-[10px] text-emerald-400 font-medium">
                  {a.status === 'pending' ? 'Pendiente' : a.status === 'arrived' ? 'Confirmada' : a.status}
                </span>
              </div>
            </div>
            {a.notes && (
              <div className="mt-3 p-2 bg-white/5 rounded-md flex gap-2">
                <ChatBubbleBottomCenterTextIcon className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                <p className="text-[9px] text-white/40 italic leading-relaxed">{a.notes}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
function getTimeRemaining(dateString: string): string {
  const target = new Date(dateString);
  const now = new Date();
  const diffTime = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Hoy";
  if (diffDays < 0) return "Vencida";
  if (diffDays === 1) return "Mañana";
  return `En ${diffDays} días`;
}