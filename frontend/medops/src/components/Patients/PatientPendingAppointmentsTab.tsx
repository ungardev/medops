// src/components/Patients/PatientPendingAppointmentsTab.tsx
import React from "react";
import { PatientTabProps } from "./types";
import { usePendingAppointments } from "../../hooks/patients/usePendingAppointments";
import { Appointment } from "../../types/appointments";

export default function PatientPendingAppointmentsTab({ patient }: PatientTabProps) {
  const { data: appointments, isLoading, error } = usePendingAppointments(patient.id);

  const isEmpty = !isLoading && !error && (appointments?.length ?? 0) === 0;

  if (isLoading)
    return <p className="text-xs sm:text-sm text-[#0d2c53] dark:text-gray-400">Cargando próximas citas...</p>;
  if (error)
    return <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">Error: {(error as Error).message}</p>;
  if (isEmpty)
    return <p className="text-xs sm:text-sm text-[#0d2c53] dark:text-gray-400">No tiene citas pendientes</p>;

    return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-3 sm:p-4 bg-white dark:bg-gray-900">
      <h3 className="text-sm sm:text-base font-semibold text-[#0d2c53] dark:text-gray-100 mb-3 sm:mb-4">
        Citas pendientes
      </h3>

      {/* 🔹 Vista desktop: tabla */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm text-left text-[#0d2c53] dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md">
          <thead className="bg-gray-100 dark:bg-gray-700 text-xs uppercase text-[#0d2c53] dark:text-gray-300">
            <tr>
              <th className="px-4 py-2 border-b">Fecha</th>
              <th className="px-4 py-2 border-b">Tipo</th>
              <th className="px-4 py-2 border-b">Estado</th>
              <th className="px-4 py-2 border-b">Notas</th>
            </tr>
          </thead>
          <tbody>
            {appointments?.map((a: Appointment) => (
              <tr key={a.id} className="border-b border-gray-200 dark:border-gray-700">
                <td className="px-4 py-2">
                  {a.appointment_date
                    ? new Date(a.appointment_date).toLocaleDateString("es-VE")
                    : "—"}
                </td>
                <td className="px-4 py-2">{a.appointment_type ?? "—"}</td>
                <td className="px-4 py-2">{a.status ?? "—"}</td>
                <td className="px-4 py-2">{a.notes || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 🔹 Vista mobile: tarjetas */}
      <div className="sm:hidden space-y-3">
        {appointments?.map((a: Appointment) => (
          <div key={a.id} className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-3">
            <p className="text-sm font-semibold text-[#0d2c53] dark:text-gray-100 mb-2">
              Cita #{a.id}
            </p>
            <div className="text-xs text-[#0d2c53] dark:text-gray-300 space-y-1">
              <div><strong>Fecha:</strong> {a.appointment_date ? new Date(a.appointment_date).toLocaleDateString("es-VE") : "—"}</div>
              <div><strong>Tipo:</strong> {a.appointment_type ?? "—"}</div>
              <div><strong>Estado:</strong> {a.status ?? "—"}</div>
              <div><strong>Notas:</strong> {a.notes || "—"}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
