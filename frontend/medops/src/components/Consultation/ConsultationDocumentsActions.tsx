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
    <div className="flex gap-3 mt-4">
      {/* Botón Informe Médico */}
      <button
        className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={generateReport.isPending || !canGenerate}
        onClick={() => generateReport.mutate(consultationId)}
      >
        {generateReport.isPending ? "Generando..." : "Generar Informe Médico"}
      </button>

      {/* Botón Documentos de Consulta */}
      <button
        className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 
                   bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 
                   hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm 
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
