// src/components/PatientEventsTab.tsx
import { useEventsByPatient } from "../../hooks/patients/useEventsByPatient";
import { PatientEvent } from "../../hooks/patients/useEventsByPatient";

interface Props {
  patientId: number;
}

export default function PatientEventsTab({ patientId }: Props) {
  const { data, isLoading, error } = useEventsByPatient(patientId);

  const events = data?.list ?? [];
  const isEmpty = !isLoading && !error && events.length === 0;

  if (isLoading) return <p>Cargando eventos...</p>;
  if (error) return <p className="text-danger">Error: {error.message}</p>;
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
              <td>{new Date(ev.timestamp).toLocaleString()}</td>
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
