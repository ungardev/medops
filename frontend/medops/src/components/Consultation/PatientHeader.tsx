import type { Patient } from "../../types/patients";
import { Link } from "react-router-dom";
import { FaUser } from "react-icons/fa";

interface PatientHeaderProps {
  patient: Patient & {
    balance_due?: number;
    age?: number | null;
  };
}

interface AddressChain {
  country: string;
  country_id: number | null;
  state: string;
  state_id: number | null;
  municipality: string;
  municipality_id: number | null;
  parish: string;
  parish_id: number | null;
  neighborhood: string;
  neighborhood_id: number | null;
}

const EMPTY_CHAIN: AddressChain = {
  country: "",
  country_id: null,
  state: "",
  state_id: null,
  municipality: "",
  municipality_id: null,
  parish: "",
  parish_id: null,
  neighborhood: "",
  neighborhood_id: null,
};

function extractPhone(contact_info: any): string {
  if (!contact_info) return "—";
  if (typeof contact_info === "string") {
    const trimmed = contact_info.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        const parsed = JSON.parse(trimmed);
        return parsed.phone ?? parsed.tel ?? parsed.mobile ?? "—";
      } catch {
        return trimmed || "—";
      }
    }
    return trimmed || "—";
  }
  if (typeof contact_info === "object" && contact_info !== null) {
    return contact_info.phone ?? contact_info.tel ?? contact_info.mobile ?? "—";
  }
  return String(contact_info) || "—";
}

function formatBirthdate(birthdate?: string | null): string {
  if (!birthdate) return "—";
  const d = new Date(birthdate);
  return !isNaN(d.getTime())
    ? d.toLocaleDateString("es-VE", { day: "2-digit", month: "2-digit", year: "numeric" })
    : birthdate;
}

function normalizeGender(g?: string | null): string {
  if (!g) return "—";
  if (g === "M") return "M";
  if (g === "F") return "F";
  return "—";
}

function buildFullAddress(patient: Patient): string {
  const chain: AddressChain = (patient.address_chain as AddressChain) ?? EMPTY_CHAIN;
  const direccionTexto = (patient.address ?? "").trim();

  const parts = [
    direccionTexto,
    chain.country,
    chain.state,
    chain.municipality,
    chain.parish,
    chain.neighborhood,
  ]
    .map((x) => (x ?? "").trim())
    .filter((x) => x.length > 0);

  return parts.length > 0 ? parts.join(", ") : "—";
}

export default function PatientHeader({ patient }: PatientHeaderProps) {
  const phone = extractPhone(patient.contact_info);
  const birthdate = formatBirthdate(patient.birthdate);
  const gender = normalizeGender(patient.gender);
  const fullAddress = buildFullAddress(patient);

  return (
    <div className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 sm:p-4 text-xs sm:text-sm text-[#0d2c53] dark:text-gray-300 space-y-2">
      {/* 🟦 Línea 1: Nombre + ícono juntos */}
      <div className="flex items-center gap-2 min-w-0">
        <h2 className="text-sm sm:text-base font-semibold text-[#0d2c53] dark:text-white truncate">
          {patient.full_name}
        </h2>
        <Link
          to={`/patients/${patient.id}`}
          aria-label="Ver ficha del paciente"
          title="Ver ficha del paciente"
          className="text-[#0d2c53] dark:text-gray-200 hover:text-[#0b2444] dark:hover:text-gray-400"
        >
          <FaUser className="w-4 h-4" />
        </Link>
      </div>

      {/* 🟨 Línea 2: Datos clínicos clave */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span><strong>Edad:</strong> {patient.age ?? "—"}</span>
        <span><strong>Sexo:</strong> {gender}</span>
        <span><strong>Nacimiento:</strong> {birthdate}</span>
        <span><strong>Teléfono:</strong> {phone}</span>
        <span><strong>Email:</strong> {patient.email || "—"}</span>
        {patient.balance_due !== undefined && (
          <span className="font-semibold">
            {patient.balance_due > 0 ? (
              <span className="text-red-600">Saldo: ${patient.balance_due.toFixed(2)}</span>
            ) : (
              <span className="text-green-600">Al día</span>
            )}
          </span>
        )}
      </div>

      {/* 🟥 Línea 3: Dirección con etiqueta */}
      <div className="whitespace-normal break-words">
        <span><strong>Dirección:</strong> {fullAddress}</span>
      </div>

      {/* 🟩 Alergias con etiqueta */}
      {patient.allergies && String(patient.allergies).trim() !== "" && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="font-semibold">Alergias:</span>
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
        </div>
      )}
    </div>
  );
}
