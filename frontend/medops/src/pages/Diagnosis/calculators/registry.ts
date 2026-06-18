// src/pages/Diagnosis/calculators/registry.ts
import type { CalculatorConfig } from "@/api/diagnosis";

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
