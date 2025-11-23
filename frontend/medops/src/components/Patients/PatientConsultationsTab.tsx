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

  if (isLoading) {
    return <p className="text-sm text-gray-600 dark:text-gray-400">Cargando consultas...</p>;
  }

  if (error && !data) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400">
        Error cargando consultas. Intenta recargar o verificar conexión.
      </p>
    );
  }

  if (!data || !Array.isArray(data.list)) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400">
        Datos de consulta malformados. Verifica el backend o el tipado.
      </p>
    );
  }

  if (data.list.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Este paciente no tiene consultas registradas.
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4 bg-white dark:bg-gray-900">
      <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">
        Consultas registradas
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md">
          <thead className="bg-gray-100 dark:bg-gray-700 text-xs uppercase text-gray-600 dark:text-gray-300">
            <tr>
              <th className="px-4 py-2 border-b border-gray-300 dark:border-gray-600">ID</th>
              <th className="px-4 py-2 border-b border-gray-300 dark:border-gray-600">Fecha</th>
              <th className="px-4 py-2 border-b border-gray-300 dark:border-gray-600">Estado</th>
              <th className="px-4 py-2 border-b border-gray-300 dark:border-gray-600">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data.list.map((c: Appointment) => (
              <tr key={c.id} className="border-b border-gray-200 dark:border-gray-700">
                <td className="px-4 py-2">{c.id}</td>
                <td className="px-4 py-2">
                  {c.appointment_date
                    ? new Date(c.appointment_date).toLocaleDateString("es-VE")
                    : "—"}
                </td>
                <td className="px-4 py-2">{c.status}</td>
                <td className="px-4 py-2">
                  <button
                    className="px-3 py-1 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
                    onClick={() =>
                      navigate(`/patients/${patient.id}/consultations/${c.id}`)
                    }
                  >
                    Ver
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        Total de consultas completadas: <strong>{data.totalCount}</strong>
      </p>
    </div>
  );
}
