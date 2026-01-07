// src/components/Consultation/ConsultationDocumentsActions.tsx
import { useGenerateMedicalReport } from "../../hooks/consultations/useGenerateMedicalReport";
import { useGenerateConsultationDocuments } from "../../hooks/consultations/useGenerateConsultationDocuments";
import { 
  DocumentArrowDownIcon, 
  PrinterIcon, 
  ArrowPathIcon,
  DocumentDuplicateIcon 
} from "@heroicons/react/24/outline";

interface ConsultationDocumentsActionsProps {
  consultationId: number;
}

export default function ConsultationDocumentsActions({
  consultationId,
}: ConsultationDocumentsActionsProps) {
  const generateReport = useGenerateMedicalReport();
  const generateDocuments = useGenerateConsultationDocuments();

  const canGenerate = !generateReport.isPending && !generateDocuments.isPending;

  return (
    <div className="flex flex-wrap gap-3 mt-6">
      {/* BOTÓN: INFORME MÉDICO (ACCIÓN PRIMARIA) */}
      <button
        disabled={generateReport.isPending || !canGenerate}
        onClick={() => generateReport.mutate(consultationId)}
        className={`
          flex items-center gap-3 px-5 py-2.5 rounded-sm text-[10px] font-black uppercase tracking-[0.15em] transition-all
          ${generateReport.isPending 
            ? "bg-white/5 text-[var(--palantir-muted)] cursor-not-allowed" 
            : "bg-[var(--palantir-active)] text-white shadow-[0_0_15px_rgba(0,255,255,0.2)] hover:shadow-[0_0_25px_rgba(0,255,255,0.4)] hover:scale-[1.02] active:scale-95"}
        `}
      >
        {generateReport.isPending ? (
          <ArrowPathIcon className="w-4 h-4 animate-spin" />
        ) : (
          <DocumentDuplicateIcon className="w-4 h-4" />
        )}
        <span className="border-l border-white/20 pl-3">
          {generateReport.isPending ? "COMPILLING_REPORT..." : "GENERATE_MEDICAL_REPORT"}
        </span>
      </button>

      {/* BOTÓN: DOCUMENTOS DE CONSULTA (RECETAS, ÓRDENES, ETC) */}
      <button
        disabled={generateDocuments.isPending || !canGenerate}
        onClick={() => generateDocuments.mutate(consultationId)}
        className={`
          flex items-center gap-3 px-5 py-2.5 rounded-sm border text-[10px] font-black uppercase tracking-[0.15em] transition-all
          ${generateDocuments.isPending 
            ? "border-white/5 bg-white/5 text-[var(--palantir-muted)]" 
            : "border-[var(--palantir-border)] bg-white/5 text-[var(--palantir-text)] hover:bg-white/10 hover:border-[var(--palantir-text)]"}
        `}
      >
        {generateDocuments.isPending ? (
          <ArrowPathIcon className="w-4 h-4 animate-spin" />
        ) : (
          <PrinterIcon className="w-4 h-4" />
        )}
        <span className="border-l border-white/10 pl-3">
          {generateDocuments.isPending ? "BUILDING_ASSETS..." : "PRINT_CONSULTATION_PACK"}
        </span>
      </button>

      {/* INDICADOR DE ESTADO DE SALIDA (LOG) */}
      <div className="flex items-center ml-auto">
        <div className="flex flex-col items-end gap-1 px-3 border-r border-white/10">
          <span className="text-[7px] font-mono text-[var(--palantir-muted)] uppercase">Output_Channel</span>
          <span className="text-[9px] font-mono text-[var(--palantir-active)]">PDF_ENCODER_V1</span>
        </div>
      </div>
    </div>
  );
}
