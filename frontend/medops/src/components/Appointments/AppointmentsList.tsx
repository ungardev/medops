// src/components/Appointments/AppointmentsList.tsx
import React from "react";
import { Appointment, AppointmentStatus } from "types/appointments";

interface AppointmentsListProps {
  appointments: Appointment[];
  onEdit: (a: Appointment) => void;
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: AppointmentStatus) => void;
}

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  pending: "bg-yellow-50 text-yellow-800 ring-yellow-600/20",
  arrived: "bg-blue-50 text-blue-800 ring-blue-600/20",
  in_consultation: "bg-indigo-50 text-indigo-800 ring-indigo-600/20",
  completed: "bg-green-50 text-green-800 ring-green-600/20",
  canceled: "bg-red-50 text-red-800 ring-red-600/20",
};

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  pending: "bg-yellow-500",
  arrived: "bg-blue-500",
  in_consultation: "bg-indigo-500",
  completed: "bg-green-500",
  canceled: "bg-red-500",
};

export default function AppointmentsList({
  appointments,
  onEdit,
  onDelete,
  onStatusChange,
}: AppointmentsListProps) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-x-auto">
      <table className="w-full text-xs sm:text-sm text-left text-[#0d2c53] dark:text-gray-100">
        <thead className="bg-gray-100 dark:bg-gray-700 text-[11px] sm:text-xs uppercase text-[#0d2c53] dark:text-gray-300">
          <tr>
            <th className="px-2 sm:px-4 py-1.5 sm:py-2 border-b">Paciente</th>
            <th className="px-2 sm:px-4 py-1.5 sm:py-2 border-b">Fecha</th>
            <th className="px-2 sm:px-4 py-1.5 sm:py-2 border-b">Tipo</th>
            <th className="px-2 sm:px-4 py-1.5 sm:py-2 border-b">Estado</th>
            <th className="px-2 sm:px-4 py-1.5 sm:py-2 border-b text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {appointments.length === 0 && (
            <tr>
              <td
                colSpan={5}
                className="px-2 sm:px-4 py-3 sm:py-4 text-center text-xs sm:text-sm text-[#0d2c53] dark:text-gray-400 italic"
              >
                No hay citas registradas.
              </td>
            </tr>
          )}

          {appointments.map((a) => (
            <tr key={a.id} className="border-b border-gray-200 dark:border-gray-700">
              <td className="px-2 sm:px-4 py-1.5 sm:py-2">{a.patient?.full_name ?? `ID: ${a.patient?.id}`}</td>
              <td className="px-2 sm:px-4 py-1.5 sm:py-2">{a.appointment_date}</td>
              <td className="px-2 sm:px-4 py-1.5 sm:py-2 capitalize">{a.appointment_type}</td>
              <td className="px-2 sm:px-4 py-1.5 sm:py-2">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span
                    className={`inline-block h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full ${STATUS_COLORS[a.status]}`}
                  ></span>
                  <span
                    className={`inline-flex items-center rounded-md px-1.5 sm:px-2 py-0.5 sm:py-1 text-[11px] sm:text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[a.status]}`}
                  >
                    {a.status}
                  </span>
                </div>
              </td>
              <td className="px-2 sm:px-4 py-1.5 sm:py-2 text-right">
                <div className="flex justify-end gap-1.5 sm:gap-2">
                  {a.status !== "canceled" && (
                    <button
                      onClick={() => onStatusChange(a.id, "canceled")}
                      className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-md border border-gray-300 dark:border-gray-600 
                                 bg-gray-100 dark:bg-gray-700 text-red-600 dark:text-red-400 
                                 hover:bg-gray-200 dark:hover:bg-gray-600 transition text-[11px] sm:text-sm"
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    onClick={() => onEdit(a)}
                    className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-md border border-gray-300 dark:border-gray-600 
                               bg-gray-100 dark:bg-gray-700 text-[#0d2c53] dark:text-gray-200 
                               hover:bg-gray-200 dark:hover:bg-gray-600 transition text-[11px] sm:text-sm"
                  >
                    Ver detalle
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm("¿Está seguro de eliminar esta cita?")) {
                        onDelete(a.id);
                      }
                    }}
                    className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-md border border-gray-300 dark:border-gray-600 
                               bg-gray-100 dark:bg-gray-700 text-[#0d2c53] dark:text-gray-200 
                               hover:bg-gray-200 dark:hover:bg-gray-600 transition text-[11px] sm:text-sm"
                  >
                    Eliminar
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
