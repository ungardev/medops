import type { MedicalReport } from "../../types/medicalReport";
import { MedicalReportHeader } from "./MedicalReportHeader";

interface Props {
  report: MedicalReport;
}

export function MedicalReportViewer({ report }: Props) {
  return (
    <div className="medical-report-viewer">
      {/* 🔹 Encabezado institucional y médico */}
      <MedicalReportHeader report={report} />

      {/* 🔹 PDF embebido */}
      {report.file_url ? (
        <iframe
          src={report.file_url}
          title="Informe Médico"
          style={{ width: "100%", height: "600px", border: "1px solid #ccc", marginTop: "20px" }}
        />
      ) : (
        <p>No se ha generado archivo PDF aún.</p>
      )}
    </div>
  );
}
