// src/components/Patients/VaccinationMatrixUniversal.tsx
import { useState } from "react";
import { VaccinationSchedule, PatientVaccination } from "../../hooks/patients/useVaccinations";
interface Props {
  schedule: VaccinationSchedule[] | { results: VaccinationSchedule[] };
  vaccinations: PatientVaccination[];
  onRegisterDose?: (dose: VaccinationSchedule) => void;
}
const AGE_GROUPS = [
  "RN", "2m", "4m", "6m", "12m", "15m", "18m", "24m",
  "3–6a", "7–9a", "10–14a", "15–19a", "20–29a", "30–39a", "40–49a", "50–59a", "60–69a", "70+a",
];
export default function VaccinationMatrixUniversal({ schedule, vaccinations, onRegisterDose }: Props) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const scheduleData: VaccinationSchedule[] = Array.isArray(schedule) 
    ? schedule 
    : (schedule as any)?.results ?? [];
  const vaccineList = [
    { code: "BCG", name: "Anti tuberculosis" },
    { code: "HB", name: "Anti Hepatitis B" },
    { code: "POLIO", name: "Anti poliomielitis" },
    { code: "DTP", name: "Anti Difteria, Tétanos y Pertussis" },
    { code: "HIB", name: "Anti Haemophilus influenzae" },
    { code: "ROTAV", name: "Anti rotavirus" },
    { code: "NEUMO", name: "Anti Neumococo conjugada" },
    { code: "INFLUENZA", name: "Anti influenza" },
    { code: "SRP", name: "Anti Sarampión, Rubéola y Parotiditis" },
    { code: "FA", name: "Anti Fiebre amarilla" },
    { code: "HA", name: "Anti Hepatitis A" },
    { code: "VAR", name: "Anti Varicela" },
    { code: "MENACWY", name: "Anti Meningococo ACYW" },
    { code: "MENB", name: "Anti MenB" },
    { code: "NEUMO23", name: "Anti Neumococo 23V (adultos)" },
    { code: "VPH", name: "Virus Papiloma Humano" },
    { code: "COVID", name: "Anti-COVID-19" },
    { code: "VSR", name: "Virus Sincitial Respiratorio" },
    { code: "DENGUE", name: "Dengue" },
  ];
  return (
    <div className="overflow-x-auto custom-scrollbar">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-white/5">
            <th className="sticky left-0 z-20 bg-white/5 px-4 py-3 border-r border-b border-white/15 text-left text-[10px] font-medium text-white/50 uppercase tracking-wider min-w-[140px]">
              Vacuna
            </th>
            {AGE_GROUPS.map((age) => (
              <th key={age} className="px-2 py-3 border-b border-r border-white/10 text-center text-[9px] font-medium text-white/40 min-w-[50px]">
                {age}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {vaccineList.map((v) => (
            <tr 
              key={v.code} 
              onMouseEnter={() => setHoveredRow(v.code)}
              onMouseLeave={() => setHoveredRow(null)}
              className={`${hoveredRow === v.code ? 'bg-white/5' : ''} transition-colors`}
            >
              <td className="sticky left-0 z-20 bg-white/5 px-4 py-3 border-r border-b border-white/15">
                <div className="flex flex-col">
                  <span className="text-[11px] font-semibold text-white/80">{v.code}</span>
                  <span className="text-[9px] text-white/40 truncate max-w-[120px]">{v.name}</span>
                </div>
              </td>
              
              {AGE_GROUPS.map((age) => {
                const dose = scheduleData.find(d => 
                  d.vaccine_detail.code === v.code && 
                  ageGroupMatches(age, d.recommended_age_months)
                );
                const applied = vaccinations.find(app => 
                  app.vaccine_detail.code === v.code && 
                  app.dose_number === dose?.dose_number
                );
                
                let cellClass = "bg-transparent text-transparent";
                if (applied) {
                  cellClass = "bg-emerald-500/15 text-emerald-400";
                } else if (dose) {
                  cellClass = "bg-amber-500/10 text-amber-400/60";
                }
                
                return (
                  <td
                    key={`${v.code}-${age}`}
                    onClick={() => onRegisterDose?.(dose || createVirtualDose(v, age))}
                    className={`group relative px-2 py-3 border-r border-b border-white/10 text-center cursor-pointer transition-all hover:z-10 hover:bg-white/5 ${cellClass}`}
                  >
                    <span className="text-[11px] font-medium">
                      {applied ? "✓" : dose ? dose.dose_number : ""}
                    </span>
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
function ageGroupMatches(age: string, months: number): boolean {
  const map: Record<string, number> = {
    "RN": 0, "2m": 2, "4m": 4, "6m": 6, "12m": 12, "15m": 15, "18m": 18, "24m": 24,
  };
  if (age === "3–6a") return months >= 36 && months <= 72;
  if (age === "7–9a") return months >= 84 && months <= 108;
  if (age === "10–14a") return months >= 120 && months <= 168;
  if (age === "15–19a") return months >= 180 && months <= 228;
  if (age === "20–29a") return months >= 240 && months <= 348;
  if (age === "30–39a") return months >= 360 && months <= 468;
  if (age === "40–49a") return months >= 480 && months <= 588;
  if (age === "50–59a") return months >= 600 && months <= 708;
  if (age === "60–69a") return months >= 720 && months <= 828;
  if (age === "70+a") return months >= 840;
  return map[age] === months;
}
function createVirtualDose(v: { code: string, name: string }, age: string): VaccinationSchedule {
  const ageGroupToMonths: Record<string, number> = {
    "RN": 0, "2m": 2, "4m": 4, "6m": 6, "12m": 12, "15m": 15, "18m": 18, "24m": 24,
    "3–6a": 36, "7–9a": 84, "10–14a": 120, "15–19a": 180, "20–29a": 240,
    "30–39a": 360, "40–49a": 480, "50–59a": 600, "60–69a": 720, "70+a": 840,
  };
  return {
    id: -1,
    vaccine: 0,
    vaccine_detail: { 
      id: 0, 
      code: v.code, 
      name: v.name, 
      country: "Venezuela" 
    },
    recommended_age_months: ageGroupToMonths[age] ?? 0,
    dose_number: 1,
    country: "Venezuela"
  };
}