// src/pages/Patients/PatientConsultationsDetail.tsx
import { useParams } from "react-router-dom";
import { useConsultationById } from "../../hooks/consultations/useConsultationById";
import {
  PatientHeader,
  DocumentsPanel,
  ConsultationActions,
  ChargeOrderPanel,
} from "../../components/Consultation";
import ConsultationWorkflow from "../../components/Consultation/ConsultationWorkflow";
import { useGenerateMedicalReport } from "../../hooks/consultations/useGenerateMedicalReport";
import { useGenerateConsultationDocuments } from "../../hooks/consultations/useGenerateConsultationDocuments";
import Toast from "../../components/Common/Toast";
import { useState, useEffect } from "react";
import type { Patient as PatientsPatient } from "../../types/patients";

// Adaptador: normaliza el paciente de consulta al tipo esperado por PatientHeader
function toPatientHeaderPatient(p: any): PatientsPatient & { balance_due?: number; age?: number | null } {
  const full_name =
    p.full_name ??
    [p.first_name, p.middle_name, p.last_name, p.second_last_name].filter(Boolean).join(" ").trim();

  return {
    id: p.id,
    national_id: p.national_id ?? "",
    first_name: p.first_name ?? "",
    middle_name: p.middle_name ?? "",
    last_name: p.last_name ?? "",
    second_last_name: p.second_last_name ?? "",
    birthdate: p.birthdate ?? null,
    gender: p.gender ?? null,
    email: p.email ?? "",
    contact_info: p.contact_info ?? "",
    address: p.address ?? "",
    weight: p.weight ?? null,
    height: p.height ?? null,
    blood_type: p.blood_type ?? undefined,
    allergies: p.allergies ?? "",
    medical_history: p.medical_history ?? "",
    active: p.active ?? true,
    created_at: p.created_at ?? null,
    updated_at: p.updated_at ?? null,
    full_name,
    balance_due: p.balance_due ?? undefined,
    age: p.age ?? null,
  };
}

export default function PatientConsultationsDetail() {
  const { patientId, appointmentId } = useParams<{ patientId: string; appointmentId: string }>();
  const patientIdNum = Number(patientId);
  const appointmentIdNum = Number(appointmentId);

  const { data: appointment, isLoading, error } = useConsultationById(appointmentIdNum);
  const generateReport = useGenerateMedicalReport();
  const generateDocuments = useGenerateConsultationDocuments();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const [readOnly, setReadOnly] = useState<boolean>(() => {
    const saved = localStorage.getItem("consultationReadOnly");
    return saved ? JSON.parse(saved) : true;
  });
  useEffect(() => {
    localStorage.setItem("consultationReadOnly", JSON.stringify(readOnly));
  }, [readOnly]);

  if (!patientId || !appointmentId || isNaN(patientIdNum) || isNaN(appointmentIdNum)) {
    return <p className="text-sm text-red-600 dark:text-red-400">Ruta inválida: parámetros incorrectos</p>;
  }

  if (isLoading) return <p className="text-gray-500">Cargando consulta...</p>;
  if (error) return <p className="text-red-600">Error cargando consulta</p>;
  if (!appointment) return <p className="text-red-600">No se encontró la consulta</p>;

  const canGenerateReport =
    appointment.status === "in_consultation" || appointment.status === "completed";

  const handleGenerateReport = async () => {
    try {
      await generateReport.mutateAsync(appointment.id);
      setToast({ message: "Informe médico generado correctamente", type: "success" });
    } catch (err: any) {
      setToast({ message: err.message || "Error al generar informe médico", type: "error" });
    }
  };

  const handleGenerateDocuments = async () => {
    try {
      await generateDocuments.mutateAsync(appointment.id);
      setToast({ message: "Documentos de consulta generados correctamente", type: "success" });
    } catch (err: any) {
      setToast({ message: err.message || "Error al generar documentos", type: "error" });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Banner de modo lectura */}
      <div
        className={`p-3 rounded-md text-center font-semibold shadow-sm ${
          readOnly
            ? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-200"
        }`}
      >
        {readOnly
          ? "Modo lectura — Consulta bloqueada"
          : "⚠️ Modo edición activa — Cambios en curso"}
      </div>

      {/* Identidad del paciente */}
      <PatientHeader patient={toPatientHeaderPatient(appointment.patient)} />

      {/* Layout clínico jerárquico */}
      <div className="grid grid-cols-12 gap-6">
        {/* Columna izquierda: Documentos + Cobros */}
        <div className="col-span-3 space-y-4">
          <div className="rounded-lg shadow-lg p-4 bg-white dark:bg-gray-800">
            <DocumentsPanel
              patientId={appointment.patient.id}
              appointmentId={appointment.id}
              readOnly={readOnly}
            />
          </div>

          <div className="rounded-lg shadow-lg p-4 bg-white dark:bg-gray-800">
            <ChargeOrderPanel
              appointmentId={appointment.id}
              chargeOrder={appointment.charge_order}
              readOnly={readOnly}
            />
          </div>
        </div>

        {/* Columna derecha: Flujo clínico dominante */}
        <div className="col-span-9">
          <ConsultationWorkflow
            diagnoses={appointment.diagnoses}
            appointmentId={appointment.id}
            notes={appointment.notes ?? null}
            readOnly={readOnly}
          />
        </div>
      </div>

      {/* Footer: Botones de acción */}
      <div className="flex flex-col gap-4 mt-6">
        <div className="flex items-center justify-between">
          <ConsultationActions consultationId={appointment.id} />

          {canGenerateReport && (
            <div className="flex items-center gap-2">
              <button
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                disabled={generateReport.isPending}
                onClick={handleGenerateReport}
              >
                {generateReport.isPending ? "Generando..." : "Generar Informe Médico"}
              </button>

              {generateReport.data?.file_url && (
                <a
                  href={generateReport.data.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 transition-colors"
                >
                  Ver Informe Médico
                </a>
              )}

              <button
                className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
                disabled={generateDocuments.isPending}
                onClick={handleGenerateDocuments}
              >
                {generateDocuments.isPending
                  ? "Generando..."
                  : "Generar Documentos de Consulta"}
              </button>
            </div>
          )}
        </div>

        {/* Botón de modo edición */}
        <div className="flex justify-end">
          <button
            className="px-4 py-2 rounded-md bg-yellow-600 text-white hover:bg-yellow-700 transition-colors text-sm"
            onClick={() => setReadOnly((prev) => !prev)}
          >
            {readOnly ? "Activar edición" : "Cerrar edición"}
          </button>
        </div>
      </div>

      {/* Toast feedback */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
