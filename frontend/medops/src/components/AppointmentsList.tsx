import React from "react";
import { Appointment, AppointmentStatus } from "types/appointments";

interface AppointmentsListProps {
  appointments: Appointment[];
  onEdit: (a: Appointment) => void;
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: AppointmentStatus) => void;
}

export default function AppointmentsList({
  appointments,
  onEdit,
  onDelete,
  onStatusChange,
}: AppointmentsListProps) {
  return (
    <table>
      <thead>
        <tr>
          <th>Paciente</th>
          <th>Fecha</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {appointments.map((a) => (
          <tr key={a.id}>
            {/* 👇 Aquí usamos el campo correcto */}
            <td>{a.patient?.name ?? `ID: ${a.patient?.id}`}</td>
            <td>{a.appointment_date}</td>
            <td>{a.status}</td>
            <td>
              {a.status === "pending" && (
                <button onClick={() => onStatusChange(a.id, "arrived")}>
                  ✅ Marcar como llegado
                </button>
              )}
              {a.status === "arrived" && (
                <button onClick={() => onStatusChange(a.id, "in_consultation")}>
                  ▶️ Iniciar consulta
                </button>
              )}
              {a.status === "in_consultation" && (
                <button onClick={() => onStatusChange(a.id, "completed")}>
                  🏁 Finalizar consulta
                </button>
              )}
              {a.status !== "canceled" && (
                <button onClick={() => onStatusChange(a.id, "canceled")}>
                  ❌ Cancelar
                </button>
              )}
              <button onClick={() => onEdit(a)}>✏️ Editar</button>
              <button onClick={() => onDelete(a.id)}>🗑 Eliminar</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
