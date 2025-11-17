// src/components/Patients/PatientConsultationsTab.tsx
import { useNavigate } from "react-router-dom";
import { Patient } from "../../types/patients";
import { Appointment } from "../../types/appointments";
import { useConsultationsByPatient } from "../../hooks/patients/useConsultationsByPatient";

interface PatientConsultationsTabProps {
  patient: Patient;
}

export default function PatientConsultationsTab({ patient }: PatientConsultationsTabProps) {
  const navigate = useNavigate();
  const { data, isLoading, error } = useConsultationsByPatient(patient.id);

  if (isLoading) return <p>Cargando consultas...</p>;
  if (error) return <p className="text-danger">Error cargando consultas</p>;
  if (!data || data.list.length === 0) {
    return <p className="text-muted">Este paciente no tiene consultas registradas.</p>;
  }

  return (
    <div className="patient-consultations-tab">
      <table className="table mt-4">
        <thead>
          <tr>
            <th>ID</th>
            <th>Fecha</th>
            <th>Estado</th>
            <th>Médico</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {data.list.map((c: Appointment) => (
            <tr key={c.id}>
              <td>{c.id}</td>
              <td>
                {c.appointment_date
                  ? new Date(c.appointment_date).toLocaleDateString("es-VE")
                  : "—"}
              </td>
              <td>{c.status}</td>
              <td>{c.doctor_name ?? "-"}</td>
              <td>
                <div className="flex gap-2">
                  {/* Botón Ver → lleva a PatientConsultationDetail */}
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() =>
                      navigate(`/patients/${patient.id}/consultations/${c.id}`)
                    }
                  >
                    Ver
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-2 text-sm text-muted">
        Total de consultas completadas: {data.totalCount}
      </p>
    </div>
  );
}
