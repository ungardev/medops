// src/api/diagnosis.ts
import { apiFetch } from "./client";

const ENDPOINT = "medical-calculations/";

export interface CalculatorInput {
  name: string;
  label: string;
  type: "number" | "select" | "boolean";
  required: boolean;
  options?: Array<{ value: string | number | boolean; label: string }>;
  min_value?: number;
  max_value?: number;
  step?: number;
  default_unit?: string;
  auto_fill_from_patient?: string;
}

export interface CalculatorConfig {
  id: string;
  name: string;
  specialty: string;
  category: string;
  description: string;
  inputs: CalculatorInput[];
  references: string[];
}

export interface CalculationResult {
  name: string;
  label: string;
  value: number;
  unit: string | null;
  interpretation: string | null;
  risk_level: string | null;
  details: Array<{ label: string; value: string }>;
}

export interface SavedCalculation {
  id: number;
  patient: number;
  calculator_id: string;
  calculator_id_display: string;
  calculator_name: string;
  inputs: Record<string, unknown>;
  result_value: number;
  result_unit: string | null;
  interpretation: string | null;
  risk_level: string | null;
  risk_level_display: string | null;
  result_details: { details: Array<{ label: string; value: string }> } | null;
  doctor: number | null;
  doctor_name: string | null;
  notes: string;
  created_at: string;
}

export async function getCalculatorList(): Promise<CalculatorConfig[]> {
  return apiFetch<CalculatorConfig[]>(`${ENDPOINT}calculator_list/`);
}

export async function runCalculation(params: {
  calculator_id: string;
  inputs: Record<string, unknown>;
  patient_id: number;
  notes?: string;
}): Promise<CalculationResult> {
  return apiFetch<CalculationResult>(`${ENDPOINT}calculate/`, {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function getPatientCalculations(patientId: number): Promise<SavedCalculation[]> {
  return apiFetch<SavedCalculation[]>(`${ENDPOINT}?patient=${patientId}`);
}
