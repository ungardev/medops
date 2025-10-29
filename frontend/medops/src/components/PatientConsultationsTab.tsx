// src/components/PatientConsultationsTab.tsx
import { useConsultationsByPatient } from "../hooks/useConsultationsByPatient";
import { Appointment } from "../types/appointments";

interface Props {
  patientId: number;
}

export default function PatientConsultationsTab({ patientId }: Props) {
  const { data, isLoading, error } = useConsultationsByPatient(patientId);

  const consultations = data?.list ?? [];
  const isEmpty = !isLoading && !error && consultations.length === 0;

  if (isLoading) return <p>Cargando consultas...</p>;
  if (error) return <p className="text-danger">Error: {error.message}</p>;
  if (isEmpty) return <p>No tiene consultas registradas</p>;

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
        {consultations.map((c: Appointment) => (
          <tr key={c.id}>
            <td>
              {c.appointment_date
                ? new Date(c.appointment_date).toLocaleDateString()
                : "—"}
            </td>
            <td>{c.appointment_type ?? "—"}</td>
            <td>{c.status ?? "—"}</td>
            <td>{c.notes || "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
