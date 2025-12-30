import type { Patient } from "../../types/patients";
import { Link } from "react-router-dom";
import { FaUser } from "react-icons/fa";

interface PatientHeaderProps {
  patient: Patient & {
    balance_due?: number;
    age?: number | null;
  };
}

// 🔹 Extrae teléfono desde contact_info (texto plano o JSON)
function extractPhone(contact_info: any): string {
  if (!contact_info) return "—";
  if (typeof contact_info === "string") {
    const trimmed = contact_info.trim();
    // Si parece JSON, intenta parsear
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        const parsed = JSON.parse(trimmed);
        return parsed.phone ?? parsed.tel ?? parsed.mobile ?? "—";
      } catch {
        return trimmed || "—";
      }
    }
    // Texto plano
    return trimmed || "—";
  }
  if (typeof contact_info === "object" && contact_info !== null) {
    return contact_info.phone ?? contact_info.tel ?? contact_info.mobile ?? "—";
  }
  return String(contact_info) || "—";
}

// 🔹 Formatea fecha de nacimiento (ISO string o texto)
function formatBirthdate(birthdate?: string | null): string {
  if (!birthdate) return "—";
  const d = new Date(birthdate);
  return !isNaN(d.getTime())
    ? d.toLocaleDateString("es-VE", { day: "2-digit", month: "2-digit", year: "numeric" })
    : birthdate;
}

// 🔹 Normaliza género
function normalizeGender(g?: string | null): string {
  if (!g) return "—";
  if (g === "M") return "M";
  if (g === "F") return "F";
  return "Unknown";
}

export default function PatientHeader({ patient }: PatientHeaderProps) {
  const phone = extractPhone(patient.contact_info);
  const birthdate = formatBirthdate(patient.birthdate);
  const gender = normalizeGender(patient.gender);

  return (
    <div className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 sm:p-3 text-xs sm:text-sm text-[#0d2c53] dark:text-gray-300 space-y-1">
      {/* 🔹 Línea superior: identidad + datos clave */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-sm sm:text-base font-semibold text-[#0d2c53] dark:text-white truncate">
            {patient.full_name}
          </h2>
          <Link
            to={`/patients/${patient.id}`}
            aria-label="Ver ficha del paciente"
            title="Ver ficha del paciente"
            className="text-[#0d2c53] dark:text-gray-200 hover:text-[#0b2444] dark:hover:text-gray-400 shrink-0"
          >
            <FaUser className="w-4 h-4" />
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="whitespace-nowrap"><strong>Edad:</strong> {patient.age ?? "—"}</span>
          <span className="whitespace-nowrap"><strong>Sexo:</strong> {gender}</span>
          <span className="whitespace-nowrap"><strong>Nacimiento:</strong> {birthdate}</span>
          <span className="whitespace-nowrap"><strong>Teléfono:</strong> {phone}</span>
          <span className="whitespace-nowrap"><strong>Email:</strong> {patient.email || "—"}</span>
        </div>
      </div>

      {/* 🔹 Línea inferior: saldo + alergias */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {patient.balance_due !== undefined && (
          <div className="font-semibold">
            {patient.balance_due > 0 ? (
              <span className="text-red-600">Saldo: ${patient.balance_due.toFixed(2)}</span>
            ) : (
              <span className="text-green-600">Al día</span>
            )}
          </div>
        )}

        {patient.allergies && String(patient.allergies).trim() !== "" && (
          <div className="flex flex-wrap gap-1">
            {String(patient.allergies)
              .split(",")
              .map((a, idx) => {
                const label = a.trim();
                if (!label) return null;
                return (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-200 rounded text-[10px] sm:text-xs"
                  >
                    {label}
                  </span>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
