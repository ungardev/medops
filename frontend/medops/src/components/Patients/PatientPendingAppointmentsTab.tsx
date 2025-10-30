// src/components/Patients/PatientPendingAppointmentsTab.tsx
import React from "react";
import { PatientTabProps } from "./types";
import { usePendingAppointments } from "../../hooks/patients/usePendingAppointments";
import { Appointment } from "../../types/appointments";

export default function PatientPendingAppointmentsTab({ patient }: PatientTabProps) {
  const { data: appointments, isLoading, error } = usePendingAppointments(patient.id);

  const isEmpty = !isLoading && !error && (appointments?.length ?? 0) === 0;

  if (isLoading) return <p>Cargando próximas citas...</p>;
  if (error) return <p className="text-danger">Error: {(error as Error).message}</p>;
  if (isEmpty) return <p>No tiene citas pendientes</p>;

  return (
    <table className="table">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Tipo</th>
          <th>Estado</th>
          <th>Notas</th>
        </tr>
      </thead>
      <tbody>
        {appointments?.map((a: Appointment) => (
          <tr key={a.id}>
            <td>
              {a.appointment_date
                ? new Date(a.appointment_date).toLocaleDateString("es-VE")
                : "—"}
            </td>
            <td>{a.appointment_type ?? "—"}</td>
            <td>{a.status ?? "—"}</td>
            <td>{a.notes || "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
