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
  patientId: number;
}
export default function ConsultationDocumentsActions({
  consultationId,
  patientId,
}: ConsultationDocumentsActionsProps) {
  const generateReport = useGenerateMedicalReport();
  const generateDocuments = useGenerateConsultationDocuments();
  const canGenerate = !generateReport.isPending && !generateDocuments.isPending;
  const handleGenerateDocuments = () => {
    generateDocuments.mutate({ consultationId, patientId });
  };
  return (
    <div className="flex flex-wrap gap-3">
      <button
        disabled={generateReport.isPending || !canGenerate}
        onClick={() => generateReport.mutate(consultationId)}
        className={`
          flex items-center gap-3 px-4 py-2 rounded-lg text-[10px] font-medium transition-all
          ${generateReport.isPending 
            ? "bg-white/5 text-white/20 cursor-not-allowed" 
            : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/15 hover:border-emerald-500/25"}
        `}
      >
        {generateReport.isPending ? (
          <ArrowPathIcon className="w-4 h-4 animate-spin" />
        ) : (
          <DocumentDuplicateIcon className="w-4 h-4" />
        )}
        <span className="border-l border-white/10 pl-3">
          {generateReport.isPending ? "Generando..." : "Informe Médico"}
        </span>
      </button>
      <button
        disabled={generateDocuments.isPending || !canGenerate}
        onClick={handleGenerateDocuments}
        className={`
          flex items-center gap-3 px-4 py-2 rounded-lg border text-[10px] font-medium transition-all
          ${generateDocuments.isPending 
            ? "border-white/5 bg-white/5 text-white/20" 
            : "border-white/15 bg-white/5 text-white/60 hover:bg-white/10 hover:border-white/25"}
        `}
      >
        {generateDocuments.isPending ? (
          <ArrowPathIcon className="w-4 h-4 animate-spin" />
        ) : (
          <PrinterIcon className="w-4 h-4" />
        )}
        <span className="border-l border-white/10 pl-3">
          {generateDocuments.isPending ? "Generando..." : "Imprimir Documentos"}
        </span>
      </button>
    </div>
  );
}