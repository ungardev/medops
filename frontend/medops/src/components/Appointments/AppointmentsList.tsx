import React from "react";
import { Appointment, AppointmentStatus } from "types/appointments";

interface AppointmentsListProps {
  appointments: Appointment[];
  onEdit: (a: Appointment) => void;   // ahora abre el detalle
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: AppointmentStatus) => void;
}

// 🔹 Mapa de estilos por estado (usando tokens globales)
const STATUS_STYLES: Record<AppointmentStatus, string> = {
  pending: "bg-yellow-50 text-yellow-800 ring-yellow-600/20",
  arrived: "bg-blue-50 text-blue-800 ring-blue-600/20",
  in_consultation: "bg-indigo-50 text-indigo-800 ring-indigo-600/20",
  completed: "bg-green-50 text-green-800 ring-green-600/20",
  canceled: "bg-red-50 text-red-800 ring-red-600/20",
};

// 🔹 Colores sólidos para el punto compacto
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
    <div className="card citas-list">
      <table className="table text-sm">
        <thead>
          <tr>
            <th>Paciente</th>
            <th>Fecha</th>
            <th>Tipo</th>
            <th>Estado</th>
            <th className="text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {appointments.length === 0 && (
            <tr>
              <td colSpan={5} className="text-center text-muted italic">
                No hay citas registradas.
              </td>
            </tr>
          )}

          {appointments.map((a) => (
            <tr key={a.id}>
              <td>{a.patient?.full_name ?? `ID: ${a.patient?.id}`}</td>
              <td>{a.appointment_date}</td>
              <td className="capitalize">{a.appointment_type}</td>
              <td>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span
                    className={`inline-block h-2.5 w-2.5 rounded-full ${STATUS_COLORS[a.status]}`}
                  ></span>
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[a.status]}`}
                  >
                    {a.status}
                  </span>
                </div>
              </td>
              <td className="text-right">
                <div className="btn-row">
                  {a.status !== "canceled" && (
                    <button
                      onClick={() => onStatusChange(a.id, "canceled")}
                      className="btn btn-outline text-danger"
                    >
                      Cancelar
                    </button>
                  )}
                  {/* Ahora este botón abre el detalle, no la edición directa */}
                  <button onClick={() => onEdit(a)} className="btn btn-outline">
                    Ver detalle
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm("¿Está seguro de eliminar esta cita?")) {
                        onDelete(a.id);
                      }
                    }}
                    className="btn btn-outline"
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