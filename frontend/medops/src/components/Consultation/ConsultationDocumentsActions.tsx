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
    <div className="consultation-documents-actions flex gap-4 mt-4">
      <button
        className="btn btn-primary"
        disabled={generateReport.isPending}
        onClick={() => generateReport.mutate(consultationId)}
      >
        {generateReport.isPending ? "Generando..." : "Generar Informe Médico"}
      </button>

      <button
        className="btn btn-accent"
        disabled={generateDocuments.isPending}
        onClick={() => generateDocuments.mutate(consultationId)}
      >
        {generateDocuments.isPending
          ? "Generando..."
          : "Generar Documentos de Consulta"}
      </button>
    </div>
  );
}
