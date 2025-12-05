import type { Patient } from "../../types/patients";
import { Link } from "react-router-dom";
import { FaUser } from "react-icons/fa"; // 🔹 Ícono institucional usado en PatientsList

interface PatientHeaderProps {
  patient: Patient & {
    balance_due?: number;
    age?: number | null;
  };
}

export default function PatientHeader({ patient }: PatientHeaderProps) {
  return (
    <div className="rounded-lg shadow-lg p-3 sm:p-4 bg-white dark:bg-gray-800">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
        {/* Identidad */}
        <div className="flex items-center gap-2">
          <h2 className="text-base sm:text-xl font-bold text-[#0d2c53] dark:text-white">
            {patient.full_name}
          </h2>
          {/* Ícono FaUser → clickeable directo */}
          <Link
            to={`/patients/${patient.id}`}
            aria-label="Ver ficha del paciente"
            title="Ver ficha del paciente"
            className="text-[#0d2c53] dark:text-gray-200 hover:text-[#0b2444] dark:hover:text-gray-400 transition-colors"
          >
            <FaUser className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>
        </div>

        {/* Estado financiero */}
        <div className="text-left sm:text-right">
          <p className="text-xs sm:text-sm font-semibold text-[#0d2c53] dark:text-white">
            Saldo pendiente:{" "}
            {patient.balance_due && patient.balance_due > 0 ? (
              <span className="text-red-600">
                ${patient.balance_due.toFixed(2)}
              </span>
            ) : (
              <span className="text-green-600">Al día</span>
            )}
          </p>
        </div>
      </div>

      {/* Datos clínicos clave */}
      <div className="mt-2 flex flex-wrap gap-4 text-xs sm:text-sm text-[#0d2c53] dark:text-gray-300">
        <span>
          <strong>Sexo:</strong> {patient.gender ?? "Desconocido"}
        </span>
        {patient.allergies && (
          <span className="text-yellow-600 dark:text-yellow-400">
            <strong>Alergias:</strong> {patient.allergies}
          </span>
        )}
      </div>
    </div>
  );
}
