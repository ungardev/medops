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
  auto_fill_from_lab?: string;
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
  const data = await apiFetch<CalculatorConfig[] | { list?: CalculatorConfig[] }>(
    `${ENDPOINT}calculator_list/`
  );
  if (Array.isArray(data)) return data;
  if (data && Array.isArray((data as any).list)) return (data as any).list;
  return [];
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
  const data = await apiFetch<SavedCalculation[] | { list?: SavedCalculation[] }>(
    `${ENDPOINT}?patient=${patientId}`
  );
  if (Array.isArray(data)) return data;
  if (data && Array.isArray((data as any).list)) return (data as any).list;
  return [];
}

export type Visibility = "doctor_only" | "doctor_institution" | "patient_visible" | "public";

export interface ParsedLabValue {
  test_name: string;
  value: number;
  unit: string;
  reference_range: string | null;
  is_abnormal: boolean;
  abnormal_direction: string;
  confidence: number;
  test_type: string | null;
}

export interface ParsedDocument {
  raw_text: string;
  confidence_score: number;
  document_type: string;
  lab_values: ParsedLabValue[];
  patient_name_extracted: string | null;
  date_extracted: string | null;
  parsing_warnings: string[];
}

export async function parseDocumentPreview(file: File): Promise<ParsedDocument> {
  const formData = new FormData();
  formData.append("file", file);
  return apiFetch<ParsedDocument>("documents/parse-preview/", {
    method: "POST",
    body: formData,
  });
}

export async function uploadDiagnosticDocument(params: {
  patientId: number;
  file: File;
  description: string;
  category: string;
  visibility: Visibility;
  run_ocr: boolean;
}): Promise<unknown> {
  const formData = new FormData();
  formData.append("file", params.file);
  formData.append("description", params.description);
  formData.append("category", params.category);
  formData.append("visibility", params.visibility);
  formData.append("run_ocr", String(params.run_ocr));
  return apiFetch<unknown>(`patients/${params.patientId}/upload-document/`, {
    method: "POST",
    body: formData,
  });
}

export async function reparseDocument(documentId: number): Promise<ParsedDocument> {
  return apiFetch<ParsedDocument>(`documents/${documentId}/reparse/`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export interface LabValue {
  test_name: string;
  value: number;
  unit: string;
  reference_range: string | null;
  is_abnormal: boolean;
  abnormal_direction: string;
  confidence: number;
  document_id: number | null;
  document_date: string | null;
  source: string;
}

export async function getPatientLabValues(patientId: number): Promise<LabValue[]> {
  const data = await apiFetch<{ list: LabValue[] }>(`patients/${patientId}/lab-values/`);
  return data.list ?? [];
}

export interface AICodeSuggestion {
  code: string;
  description: string;
  confidence: number;
  justification: string;
}

export interface AbnormalLabFlag {
  test: string;
  value: string;
  unit: string;
  reference_range: string | null;
  is_abnormal: boolean;
  direction: "high" | "low" | "normal";
  severity: "critical" | "warning" | "mild" | "normal";
}

export interface DrugMention {
  name: string;
  dosage: string | null;
  route: string | null;
  frequency: string | null;
}

export interface AIAnalysisResult {
  id: number;
  document: number;
  document_description: string | null;
  document_category: string;
  patient: number;
  model_used: string;
  analysis_mode: string;
  clinical_summary: string | null;
  interpretation: string | null;
  suggested_icd_codes: AICodeSuggestion[];
  abnormal_lab_flags: AbnormalLabFlag[];
  drug_mentions: DrugMention[];
  raw_response: Record<string, unknown>;
  reasoning_trace: string | null;
  confidence_score: number | null;
  tokens_used: number;
  estimated_cost_usd: string;
  latency_ms: number;
  prompt_tokens: number;
  completion_tokens: number;
  performed_by: number | null;
  performed_by_name: string | null;
  performed_at: string;
  icd_codes_count: number;
  abnormal_flags_count: number;
}

export async function analyzeDocument(
  documentId: number,
  model?: string,
  analysisMode?: string
): Promise<AIAnalysisResult> {
  return apiFetch<AIAnalysisResult>(`documents/${documentId}/analyze/`, {
    method: "POST",
    body: JSON.stringify({
      model: model || "gemini-2.5-flash",
      analysis_mode: analysisMode || "full",
    }),
  });
}

export async function getDocumentAnalysis(documentId: number): Promise<AIAnalysisResult | null> {
  try {
    return await apiFetch<AIAnalysisResult>(`documents/${documentId}/analysis/`);
  } catch {
    return null;
  }
}

export async function getPatientAnalyses(
  patientId: number,
  limit: number = 20
): Promise<{ analyses: AIAnalysisResult[] }> {
  return apiFetch<{ analyses: AIAnalysisResult[] }>(
    `patients/${patientId}/ai-analyses/?limit=${limit}`
  );
}

