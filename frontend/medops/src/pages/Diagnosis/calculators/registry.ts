// src/pages/Diagnosis/calculators/registry.ts
import type { CalculatorConfig, LabValue } from "@/api/diagnosis";

export interface PatientAutoFill {
  weight?: string;
  height?: string;
  age?: string;
  gender?: string;
}

export function getPatientAutoFill(patient: {
  weight?: string | number | null;
  height?: string | number | null;
  birthdate?: string | null;
  gender?: string | null;
}): PatientAutoFill {
  const fill: PatientAutoFill = {};

  if (patient.weight) fill.weight = String(patient.weight);
  if (patient.height) fill.height = String(patient.height);
  if (patient.birthdate) {
    const age = calculateAge(patient.birthdate);
    if (age !== null) fill.age = String(age);
  }
  if (patient.gender) fill.gender = patient.gender;

  return fill;
}

function calculateAge(birthdate: string): number | null {
  const birth = new Date(birthdate);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 0 ? age : null;
}

export const CATEGORY_ICONS: Record<string, string> = {
  Antropometría: "📐",
  Embolia: "❤️‍🔥",
  Sangrado: "🩸",
  "Función Renal": "🫘",
  Neurología: "🧠",
  Sepsis: "🦠",
  "Embolia Pulmonar": "🫁",
  Hígado: "🟤",
  "Riesgo Cardiovascular": "❤️",
  UCI: "🏥",
  Neumonía: "🫁",
};

export const RISK_COLORS: Record<string, string> = {
  Bajo: "text-emerald-400",
  "Bajo-Moderado": "text-green-400",
  Óptimo: "text-emerald-400",
  Moderado: "text-yellow-400",
  "Moderado-Alto": "text-orange-400",
  Alto: "text-red-400",
  "Muy alto": "text-red-500",
  "Extremadamente alto": "text-red-600",
};

export function getRiskColor(risk: string | null | undefined): string {
  if (!risk) return "text-white/50";
  return RISK_COLORS[risk] ?? "text-white/50";
}

export const CALCULATOR_CATEGORIES = [
  "Antropometría",
  "Embolia",
  "Sangrado",
  "Función Renal",
  "Neurología",
  "Sepsis",
  "Embolia Pulmonar",
  "Hígado",
  "Riesgo Cardiovascular",
  "UCI",
  "Neumonía",
] as const;

export function groupCalculatorsByCategory(
  calculators: CalculatorConfig[]
): Record<string, CalculatorConfig[]> {
  const groups: Record<string, CalculatorConfig[]> = {};
  for (const calc of calculators) {
    const cat = calc.category;
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(calc);
  }
  return groups;
}

const LAB_TEST_TO_CALCULATORS: Record<string, string[]> = {
  creatinina: ["ckd_epi", "meld"],
  bilirrubina_total: ["meld", "child_pugh"],
  albumina: ["child_pugh"],
  inr: ["meld", "child_pugh"],
  urea: ["curb65"],
  colesterol_total: ["framingham"],
  hdl: ["framingham"],
  hematocrito: ["apache_ii"],
  leucocitos: ["apache_ii"],
  sodio: ["apache_ii"],
  potasio: ["apache_ii"],
  hemoglobina: [],
  glucosa: [],
  plaquetas: [],
};

export function getSuggestedCalculators(
  calculators: CalculatorConfig[],
  labValues: LabValue[]
): CalculatorConfig[] {
  const availableTests = new Set(labValues.map((lv) => lv.test_name));
  const suggested: CalculatorConfig[] = [];
  const suggestedIds = new Set<string>();

  for (const calc of calculators) {
    for (const inp of calc.inputs) {
      const labKey = inp.auto_fill_from_lab;
      if (labKey && availableTests.has(labKey)) {
        if (!suggestedIds.has(calc.id)) {
          suggested.push(calc);
          suggestedIds.add(calc.id);
        }
        break;
      }
    }
  }

  return suggested;
}

export function buildLabValuesMap(labValues: LabValue[]): Record<string, LabValue> {
  const map: Record<string, LabValue> = {};
  for (const lv of labValues) {
    map[lv.test_name] = lv;
  }
  return map;
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "hace un momento";
  if (diffMins < 60) return `hace ${diffMins} min`;
  if (diffHours < 24) return `hace ${diffHours}h`;
  if (diffDays < 7) return `hace ${diffDays}d`;
  return date.toLocaleDateString("es-VE", { day: "2-digit", month: "short" });
}
