// src/components/Patients/VaccinationMatrixUniversal.tsx
import React, { useState } from "react";
import { VaccinationSchedule, PatientVaccination } from "../../hooks/patients/useVaccinations";

interface Props {
  schedule: VaccinationSchedule[] | { results: VaccinationSchedule[] }; // ← acepta array plano o paginado
  vaccinations: PatientVaccination[];
  onRegisterDose?: (dose: VaccinationSchedule) => void;
}

// Función para verificar si un grupo de edad corresponde a los meses recomendados
function ageGroupMatches(age: string, months: number): boolean {
  switch (age) {
    case "RN": return months === 0;
    case "2m": return months === 2;
    case "4m": return months === 4;
    case "6m": return months === 6;
    case "12m": return months === 12;
    case "15m": return months === 15;
    case "18m": return months === 18;
    case "24m": return months === 24;
    case "3–6a": return months >= 36 && months <= 72;
    case "7–9a": return months >= 84 && months <= 108;
    case "10–14a": return months >= 120 && months <= 168;
    case "15–19a": return months >= 180 && months <= 228;
    case "20–29a": return months >= 240 && months <= 348;
    case "30–39a": return months >= 360 && months <= 468;
    case "40–49a": return months >= 480 && months <= 588;
    case "50–59a": return months >= 600 && months <= 708;
    case "60–69a": return months >= 720 && months <= 828;
    case "70+a": return months >= 840;
    default: return false;
  }
}

// Traductor de grupo de edad a meses
function ageGroupToMonths(age: string): number {
  const map: Record<string, number> = {
    "RN": 0,
    "2m": 2,
    "4m": 4,
    "6m": 6,
    "12m": 12,
    "15m": 15,
    "18m": 18,
    "24m": 24,
    "3–6a": 36,
    "7–9a": 84,
    "10–14a": 120,
    "15–19a": 180,
    "20–29a": 240,
    "30–39a": 360,
    "40–49a": 480,
    "50–59a": 600,
    "60–69a": 720,
    "70+a": 840,
  };
  return map[age] ?? 0;
}

export default function VaccinationMatrixUniversal({
  schedule,
  vaccinations,
  onRegisterDose,
}: Props) {
  const [highlightedCell, setHighlightedCell] = useState<string | null>(null);

  // 🔐 Blindaje: acepta array plano o paginado
  const scheduleData: VaccinationSchedule[] = Array.isArray(schedule)
    ? schedule
    : schedule.results ?? [];

  const vaccineList = [
    { code: "BCG", name: "Anti tuberculosis" },
    { code: "HB", name: "Anti Hepatitis B" },
    { code: "POLIO", name: "Anti poliomielitis (VPI, bVPO)" },
    { code: "DTP", name: "Anti Difteria, Tétanos y Pertussis" },
    { code: "HIB", name: "Anti Haemophilus influenzae tipo b" },
    { code: "ROTAV", name: "Anti rotavirus (RV1, RV5)" },
    { code: "NEUMO", name: "Anti Neumococo 10–20V" },
    { code: "INFLUENZA", name: "Anti influenza" },
    { code: "SRP", name: "Anti Sarampión, Rubéola y Parotiditis" },
    { code: "FA", name: "Anti Fiebre amarilla" },
    { code: "HA", name: "Anti Hepatitis A" },
    { code: "VAR", name: "Anti Varicela" },
    { code: "MENACWY", name: "Anti Meningococo A,C,Y,W-135" },
    { code: "MENB", name: "Men B" },
    { code: "NEUMO23", name: "Anti Neumococo 23V" },
    { code: "VPH", name: "VPH" },
    { code: "COVID", name: "Anti-COVID-19" },
    { code: "VSR", name: "VSR" },
    { code: "DENGUE", name: "Dengue" },
  ];

  const ageGroups = [
    "RN", "2m", "4m", "6m", "12m", "15m", "18m", "24m",
    "3–6a", "7–9a", "10–14a", "15–19a", "20–29a",
    "30–39a", "40–49a", "50–59a", "60–69a", "70+a",
  ];

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-300 dark:border-gray-600 text-xs sm:text-sm">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100">
            <th className="px-2 py-2 border">Vacuna</th>
            {ageGroups.map((age) => (
              <th key={age} className="px-2 py-2 border text-center">
                {age}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {vaccineList.map((vaccine) => (
            <tr key={vaccine.code}>
              <td className="px-2 py-2 border font-medium text-[#0d2c53] dark:text-white">
                {vaccine.code}
              </td>
              {ageGroups.map((age) => {
                const dose = scheduleData.find(
                  (d) =>
                    d.vaccine_detail.code === vaccine.code &&
                    ageGroupMatches(age, d.recommended_age_months)
                );

                const applied = vaccinations.find(
                  (v) =>
                    v.vaccine_detail.code === vaccine.code &&
                    v.dose_number === dose?.dose_number
                );

                const cellKey = `${vaccine.code}-${age}`;

                let cellClass = "bg-gray-100 dark:bg-gray-800";
                if (highlightedCell === cellKey) {
                  cellClass = "bg-[#0d2c53]/20 dark:bg-gray-600";
                } else if (applied) {
                  cellClass = "bg-orange-200 dark:bg-orange-600";
                } else if (dose) {
                  cellClass = "bg-yellow-100 dark:bg-yellow-700";
                }

                const tooltip = applied
                  ? `Aplicada el ${applied.date_administered} — Centro: ${applied.center ?? "N/A"} — Lote: ${applied.lot ?? "N/A"}`
                  : dose
                  ? `Dosis ${dose.dose_number} recomendada`
                  : "Registrar dosis fuera de esquema";

                const virtualDose: VaccinationSchedule = dose ?? {
                  vaccine: vaccine.code.length, // dummy ID
                  vaccine_detail: {
                    id: vaccine.code.length,
                    code: vaccine.code,
                    name: vaccine.name,
                    country: "Venezuela",
                  },
                  recommended_age_months: ageGroupToMonths(age),
                  dose_number: 1,
                  country: "Venezuela",
                  id: -1,
                };

                return (
                  <td
                    key={cellKey}
                    className={`px-2 py-2 border text-center cursor-pointer ${cellClass}`}
                    onMouseEnter={() => setHighlightedCell(cellKey)}
                    onClick={() => onRegisterDose?.(virtualDose)}
                    title={tooltip}
                  >
                    {dose ? dose.dose_number : "-"}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
