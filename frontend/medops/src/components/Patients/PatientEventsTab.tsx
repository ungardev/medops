// src/components/Patients/PatientEventsTab.tsx
import { PatientTabProps } from "./types";
import { useEventsByPatient, PatientEvent } from "../../hooks/patients/useEventsByPatient";
import { CommandLineIcon, UserIcon, TagIcon, BoltIcon } from "@heroicons/react/24/outline";
export default function PatientEventsTab({ patient }: PatientTabProps) {
  const { data, isLoading, error } = useEventsByPatient(patient.id);
  const events = data?.list ?? [];
  const isEmpty = !isLoading && !error && events.length === 0;
  if (isLoading) return (
    <div className="flex items-center gap-3 p-6 text-sm text-white/40 animate-pulse">
      <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full" />
      Cargando registros de actividad...
    </div>
  );
  if (error) return (
    <div className="p-5 border border-red-500/20 bg-red-500/5 text-red-400 text-sm rounded-xl">
      Error al cargar registros: {(error as Error).message}
    </div>
  );
  if (isEmpty) return (
    <div className="p-8 border border-dashed border-white/15 rounded-xl text-center">
      <p className="text-sm text-white/40">
        No hay eventos registrados
      </p>
    </div>
  );
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 px-2">
        <CommandLineIcon className="w-5 h-5 text-emerald-400" />
        <h3 className="text-sm font-semibold text-white">
          Registro de Actividad
        </h3>
        <div className="h-[1px] flex-grow bg-gradient-to-r from-white/10 to-transparent" />
      </div>
      <div className="hidden sm:block overflow-hidden border border-white/15 rounded-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/15">
              <th className="px-5 py-4 text-xs font-medium text-white/50 uppercase tracking-wider">Fecha/Hora</th>
              <th className="px-5 py-4 text-xs font-medium text-white/50 uppercase tracking-wider">Usuario</th>
              <th className="px-5 py-4 text-xs font-medium text-white/50 uppercase tracking-wider">Entidad</th>
              <th className="px-5 py-4 text-xs font-medium text-white/50 uppercase tracking-wider">Acción</th>
              <th className="px-5 py-4 text-xs font-medium text-white/50 uppercase tracking-wider">Detalles</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 bg-white/5">
            {events.map((ev: PatientEvent) => (
              <tr key={ev.id} className="hover:bg-white/5 transition-colors group">
                <td className="px-5 py-4 text-xs text-white/60 whitespace-nowrap">
                  {new Date(ev.timestamp).toLocaleString("es-VE", { dateStyle: 'short', timeStyle: 'short' })}
                </td>
                <td className="px-5 py-4 text-xs text-emerald-400 font-medium">
                  {ev.actor || "Sistema"}
                </td>
                <td className="px-5 py-4 text-xs text-white/60">
                  <span className="text-white/40">{ev.entity}</span>
                  <span className="ml-2 text-xs bg-white/5 px-2 py-0.5 border border-white/10 rounded">#{ev.entity_id}</span>
                </td>
                <td className="px-5 py-4">
                  <ActionBadge action={ev.action} />
                </td>
                <td className="px-5 py-4">
                  {ev.metadata ? (
                    <details className="cursor-pointer">
                      <summary className="text-xs text-white/40 hover:text-emerald-400 uppercase tracking-wider list-none">
                        Ver detalles
                      </summary>
                      <pre className="mt-3 p-4 bg-black/30 rounded-xl text-xs leading-relaxed text-emerald-400/80 max-w-xs overflow-auto border border-white/10">
                        {JSON.stringify(ev.metadata, null, 2)}
                      </pre>
                    </details>
                  ) : (
                    <span className="text-xs text-white/30">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="sm:hidden space-y-3">
        {events.map((ev: PatientEvent) => (
          <div key={ev.id} className="p-5 bg-white/5 border border-white/15 rounded-xl">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs text-white/40">
                {new Date(ev.timestamp).toLocaleString("es-VE")}
              </span>
              <ActionBadge action={ev.action} />
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-white/70">{ev.actor || "Sistema"}</span>
              </div>
              <div className="flex items-center gap-2">
                <TagIcon className="w-4 h-4 text-white/30" />
                <span className="text-sm text-white/40">{ev.entity} #{ev.entity_id}</span>
              </div>
            </div>
            {ev.metadata && (
              <details className="mt-3 border-t border-white/10 pt-3">
                <summary className="text-xs text-emerald-400 uppercase tracking-wider list-none">Detalles</summary>
                <pre className="mt-3 p-3 bg-black/40 rounded-xl text-xs text-emerald-400/70 overflow-x-auto">
                  {JSON.stringify(ev.metadata, null, 1)}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
function ActionBadge({ action }: { action: string }) {
  const colorMap: Record<string, string> = {
    CREATE: "border-emerald-500/25 text-emerald-400 bg-emerald-500/10",
    UPDATE: "border-blue-500/25 text-blue-400 bg-blue-500/10",
    DELETE: "border-red-500/25 text-red-400 bg-red-500/10",
    LOGIN: "border-purple-500/25 text-purple-400 bg-purple-500/10",
  };
  const actionLabels: Record<string, string> = {
    CREATE: "Creación",
    UPDATE: "Actualización",
    DELETE: "Eliminación",
    LOGIN: "Inicio de sesión",
  };
  const actionUpper = action.toUpperCase();
  const style = colorMap[actionUpper] || "border-white/15 text-white/40 bg-white/5";
  return (
    <span className={`px-3 py-1.5 text-xs font-medium uppercase border rounded-lg ${style}`}>
      {actionLabels[actionUpper] || action}
    </span>
  );
}