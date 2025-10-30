// src/components/Patients/PatientEventsTab.tsx
import React from "react";
import { PatientTabProps } from "./types";
import { useEventsByPatient, PatientEvent } from "../../hooks/patients/useEventsByPatient";

export default function PatientEventsTab({ patient }: PatientTabProps) {
  const { data, isLoading, error } = useEventsByPatient(patient.id);

  const events = data?.list ?? [];
  const isEmpty = !isLoading && !error && events.length === 0;

  if (isLoading) return <p>Cargando eventos...</p>;
  if (error) return <p className="text-danger">Error: {(error as Error).message}</p>;
  if (isEmpty) return <p>No hay eventos registrados.</p>;

  return (
    <div className="card">
      <h3>Eventos / Auditoría</h3>
      <table className="table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Actor</th>
            <th>Entidad</th>
            <th>Acción</th>
            <th>Metadata</th>
          </tr>
        </thead>
        <tbody>
          {events.map((ev: PatientEvent) => (
            <tr key={ev.id}>
              <td>{new Date(ev.timestamp).toLocaleString("es-VE")}</td>
              <td>{ev.actor || "—"}</td>
              <td>
                {ev.entity} ({ev.entity_id})
              </td>
              <td>{ev.action}</td>
              <td>{ev.metadata ? JSON.stringify(ev.metadata) : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
