import type { MedicalReport } from "../../types/medicalReport";
interface Props {
  report: MedicalReport;
}
export function MedicalReportHeader({ report }: Props) {
  if (!report.institution || !report.doctor) {
    return <p>Datos institucionales o del médico no disponibles</p>;
  }
  // Helper para manejar File | string
  const getLogoSrc = (logo: string | File | undefined): string => {
    if (typeof logo === 'string') return logo;
    return "";
  };
  const getSignatureSrc = (signature: string | File | undefined): string => {
    if (typeof signature === 'string') return signature;
    return "";
  };
  return (
    <div className="medical-report-header text-center mb-4">
      {/* 🔹 Logo institucional */}
      {report.institution.logo && getLogoSrc(report.institution.logo) && (
        <img
          src={getLogoSrc(report.institution.logo)}
          alt="Logo institucional"
          style={{ height: "80px", marginBottom: "10px" }}
        />
      )}
      {/* 🔹 Datos de la institución */}
      <h1 className="text-xl font-bold">{report.institution.name}</h1>
      <p>
        {report.institution.address} - Tel: {report.institution.phone} - RIF:{" "}
        {report.institution.tax_id}
      </p>
      {/* 🔹 Datos del médico */}
      <h2 className="text-lg font-semibold mt-4">Médico tratante</h2>
      <p>
        {report.doctor.full_name} <br />
        Especialidad: {report.doctor.specialty} <br />
        Nº Colegiado: {report.doctor.license}
      </p>
      {/* 🔹 Firma digital */}
      {report.doctor.signature && getSignatureSrc(report.doctor.signature) && (
        <img
          src={getSignatureSrc(report.doctor.signature)}
          alt="Firma del médico"
          style={{ height: "60px", marginTop: "10px" }}
        />
      )}
    </div>
  );
}