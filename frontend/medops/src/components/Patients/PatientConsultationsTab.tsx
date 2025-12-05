// src/components/Patients/PatientConsultationsTab.tsx
import { useNavigate } from "react-router-dom";
import { Patient } from "../../types/patients";
import { Appointment } from "../../types/appointments";
import { useConsultationsByPatient } from "../../hooks/patients/useConsultationsByPatient";
import { EyeIcon } from "@heroicons/react/24/outline";

interface PatientConsultationsTabProps {
  patient: Patient;
}

export default function PatientConsultationsTab({ patient }: PatientConsultationsTabProps) {
  const navigate = useNavigate();
  const { data, isLoading, error } = useConsultationsByPatient(patient.id);

  if (isLoading) {
    return <p className="text-xs sm:text-sm text-[#0d2c53] dark:text-gray-400">Cargando consultas...</p>;
  }

  if (error && !data) {
    return (
      <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">
        Error cargando consultas. Intenta recargar o verificar conexión.
      </p>
    );
  }

  if (!data || !Array.isArray(data.list)) {
    return (
      <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">
        Datos de consulta malformados. Verifica el backend o el tipado.
      </p>
    );
  }

  if (data.list.length === 0) {
    return (
      <p className="text-xs sm:text-sm text-[#0d2c53] dark:text-gray-400">
        Este paciente no tiene consultas registradas.
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-3 sm:p-4 bg-white dark:bg-gray-900">
      <h3 className="text-sm sm:text-base font-semibold text-[#0d2c53] dark:text-gray-100 mb-3 sm:mb-4">
        Consultas registradas
      </h3>

      {/* 🔹 Vista tablet/desktop: tabla */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm text-left text-[#0d2c53] dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md">
          <thead className="bg-gray-100 dark:bg-gray-700 text-xs uppercase text-[#0d2c53] dark:text-gray-300">
            <tr>
              <th className="px-3 sm:px-4 py-1.5 sm:py-2 border-b border-gray-300 dark:border-gray-600">ID</th>
              <th className="px-3 sm:px-4 py-1.5 sm:py-2 border-b border-gray-300 dark:border-gray-600">Fecha</th>
              <th className="px-3 sm:px-4 py-1.5 sm:py-2 border-b border-gray-300 dark:border-gray-600">Estado</th>
              <th className="px-3 sm:px-4 py-1.5 sm:py-2 border-b border-gray-300 dark:border-gray-600 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data.list.map((c: Appointment) => (
              <tr key={c.id} className="border-b border-gray-200 dark:border-gray-700">
                <td className="px-3 sm:px-4 py-1.5 sm:py-2">{c.id}</td>
                <td className="px-3 sm:px-4 py-1.5 sm:py-2">
                  {c.appointment_date
                    ? new Date(c.appointment_date).toLocaleDateString("es-VE")
                    : "—"}
                </td>
                <td className="px-3 sm:px-4 py-1.5 sm:py-2">{c.status}</td>
                <td className="px-3 sm:px-4 py-1.5 sm:py-2">
                  <div className="flex justify-center items-center">
                    <EyeIcon
                      className="h-5 w-5 text-[#0d2c53] dark:text-gray-200 cursor-pointer hover:text-[#0b2444]"
                      onClick={() =>
                        navigate(`/patients/${patient.id}/consultations/${c.id}`)
                      }
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 🔹 Vista mobile: tarjetas */}
      <div className="sm:hidden space-y-3">
        {data.list.map((c: Appointment) => (
          <div
            key={c.id}
            className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-3"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-[#0d2c53] dark:text-gray-100">
                Consulta #{c.id}
              </span>
              <div className="flex justify-center items-center">
                <EyeIcon
                  className="h-5 w-5 text-[#0d2c53] dark:text-gray-200 cursor-pointer hover:text-[#0b2444]"
                  onClick={() =>
                    navigate(`/patients/${patient.id}/consultations/${c.id}`)
                  }
                />
              </div>
            </div>
            <div className="text-xs text-[#0d2c53] dark:text-gray-300 space-y-1">
              <div>
                <strong>Fecha:</strong>{" "}
                {c.appointment_date
                  ? new Date(c.appointment_date).toLocaleDateString("es-VE")
                  : "—"}
              </div>
              <div>
                <strong>Estado:</strong> {c.status}
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-[#0d2c53] dark:text-gray-400">
        Total de consultas completadas: <strong>{data.totalCount}</strong>
      </p>
    </div>
  );
}
