import React from "react";
import { PatientTabProps } from "./types";
import { useEventsByPatient, PatientEvent } from "../../hooks/patients/useEventsByPatient";

export default function PatientEventsTab({ patient }: PatientTabProps) {
  const { data, isLoading, error } = useEventsByPatient(patient.id);

  const events = data?.list ?? [];
  const isEmpty = !isLoading && !error && events.length === 0;

  if (isLoading) return <p className="text-sm text-[#0d2c53] dark:text-gray-400">Cargando eventos...</p>;
  if (error) return <p className="text-sm text-red-600 dark:text-red-400">Error: {(error as Error).message}</p>;
  if (isEmpty) return <p className="text-sm text-[#0d2c53] dark:text-gray-400">No hay eventos registrados.</p>;

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4 bg-white dark:bg-gray-900">
      <h3 className="text-base font-semibold text-[#0d2c53] dark:text-gray-100 mb-4">Eventos / Auditoría</h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-[#0d2c53] dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md">
          <thead className="bg-gray-100 dark:bg-gray-700 text-xs uppercase text-[#0d2c53] dark:text-gray-300">
            <tr>
              <th className="px-4 py-2 border-b">Fecha</th>
              <th className="px-4 py-2 border-b">Actor</th>
              <th className="px-4 py-2 border-b">Entidad</th>
              <th className="px-4 py-2 border-b">Acción</th>
              <th className="px-4 py-2 border-b">Metadata</th>
            </tr>
          </thead>
          <tbody>
            {events.map((ev: PatientEvent) => (
              <tr key={ev.id} className="border-b border-gray-200 dark:border-gray-700">
                <td className="px-4 py-2">{new Date(ev.timestamp).toLocaleString("es-VE")}</td>
                <td className="px-4 py-2">{ev.actor || "—"}</td>
                <td className="px-4 py-2">{ev.entity} ({ev.entity_id})</td>
                <td className="px-4 py-2">{ev.action}</td>
                <td className="px-4 py-2">
                  {ev.metadata ? (
                    <pre className="text-xs font-mono text-[#0d2c53] dark:text-gray-300 whitespace-pre-wrap">
                      {JSON.stringify(ev.metadata, null, 2)}
                    </pre>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
