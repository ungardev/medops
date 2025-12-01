// src/components/Consultation/ConsultationDocumentsActions.tsx
import { useGenerateMedicalReport } from "../../hooks/consultations/useGenerateMedicalReport";
import { useGenerateConsultationDocuments } from "../../hooks/consultations/useGenerateConsultationDocuments";

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
    <div className="flex gap-2 sm:gap-3 mt-3 sm:mt-4">
      {/* Botón Informe Médico */}
      <button
        className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-md bg-[#0d2c53] text-white border border-[#0d2c53] 
                   hover:bg-[#0b2444] transition-colors text-xs sm:text-sm 
                   disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={generateReport.isPending || !canGenerate}
        onClick={() => generateReport.mutate(consultationId)}
      >
        {generateReport.isPending ? "Generando..." : "Generar Informe Médico"}
      </button>

      {/* Botón Documentos de Consulta */}
      <button
        className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-md border border-gray-300 dark:border-gray-600 
                   bg-gray-100 dark:bg-gray-700 text-[#0d2c53] dark:text-gray-200 
                   hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-xs sm:text-sm 
                   disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={generateDocuments.isPending || !canGenerate}
        onClick={() => generateDocuments.mutate(consultationId)}
      >
        {generateDocuments.isPending
          ? "Generando..."
          : "Generar Documentos de Consulta"}
      </button>
    </div>
  );
}
