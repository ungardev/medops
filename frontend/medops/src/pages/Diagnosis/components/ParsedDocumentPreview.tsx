// src/pages/Diagnosis/components/ParsedDocumentPreview.tsx
import type { ParsedDocument, ParsedLabValue } from "@/api/diagnosis";
import LabResultsTable from "./LabResultsTable";
import { DocumentTextIcon, BeakerIcon } from "@heroicons/react/24/outline";

interface Props {
  parsed: ParsedDocument;
  editedValues?: ParsedLabValue[];
  onLabValuesChange?: (values: ParsedLabValue[]) => void;
}

const TYPE_LABELS: Record<string, string> = {
  lab_result: "Resultado de Laboratorio",
  imaging_report: "Reporte de Imagen",
  clinical_note: "Nota Clínica",
  unknown: "Documento",
};

export default function ParsedDocumentPreview({ parsed, editedValues, onLabValuesChange }: Props) {
  const hasLabValues = parsed.lab_values.length > 0;
  const labValues = editedValues ?? parsed.lab_values;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          parsed.document_type === "lab_result"
            ? "bg-blue-500/20 text-blue-300"
            : parsed.document_type === "imaging_report"
            ? "bg-purple-500/20 text-purple-300"
            : "bg-white/10 text-white/60"
        }`}>
          {TYPE_LABELS[parsed.document_type] ?? "Documento"}
        </div>

        <div className="flex items-center gap-1 text-xs text-white/40">
          <BeakerIcon className="h-3.5 w-3.5" />
          Confianza OCR: {parsed.confidence_score > 0 ? `${(parsed.confidence_score * 100).toFixed(0)}%` : "N/A"}
        </div>

        {parsed.patient_name_extracted && (
          <div className="text-xs text-white/40">
            Paciente: {parsed.patient_name_extracted}
          </div>
        )}

        {parsed.date_extracted && (
          <div className="text-xs text-white/40">
            Fecha: {parsed.date_extracted}
          </div>
        )}
      </div>

      {parsed.parsing_warnings.length > 0 && (
        <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-300">
          <div>
            <strong>Atención:</strong> {parsed.parsing_warnings[0]}
          </div>
        </div>
      )}

      {hasLabValues && (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
            <BeakerIcon className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium text-white">
              Valores Detectados ({parsed.lab_values.length})
            </span>
          </div>
          <div className="p-3">
            <LabResultsTable
              values={labValues}
              onChange={onLabValuesChange as never}
            />
          </div>
        </div>
      )}

      <details className="group">
        <summary className="flex items-center gap-2 cursor-pointer text-sm text-white/50 hover:text-white/70 transition-colors list-none">
          <DocumentTextIcon className="h-4 w-4" />
          Texto OCR extraído
          <span className="ml-auto text-xs text-white/30 group-hover:text-white/50">
            ({parsed.raw_text.length} caracteres)
          </span>
        </summary>
        <div className="mt-2 p-3 bg-white/5 border border-white/10 rounded-xl">
          <pre className="text-xs text-white/60 whitespace-pre-wrap break-words font-mono max-h-48 overflow-y-auto">
            {parsed.raw_text || "Sin texto extraído"}
          </pre>
        </div>
      </details>
    </div>
  );
}
