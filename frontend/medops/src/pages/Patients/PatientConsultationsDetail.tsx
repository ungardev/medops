// src/pages/Patients/PatientConsultationsDetail.tsx
import { useParams } from "react-router-dom";
import { useConsultationById } from "../../hooks/consultations/useConsultationById";
import {
  PatientHeader,
  DocumentsPanel,
  ChargeOrderPanel,
} from "../../components/Consultation";
import ConsultationWorkflow from "../../components/Consultation/ConsultationWorkflow";
import { useGenerateMedicalReport } from "../../hooks/consultations/useGenerateMedicalReport";
import { useGenerateConsultationDocuments } from "../../hooks/consultations/useGenerateConsultationDocuments";
import Toast from "../../components/Common/Toast";
import { useState, useEffect } from "react";
import type { Patient as PatientsPatient } from "../../types/patients";

// 🔹 Utilidad: calcular edad desde birthdate
function calcAge(birthdate?: string | null): number | null {
  if (!birthdate) return null;
  const d = new Date(birthdate);
  if (Number.isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

// 🔹 Normalización segura de campos clínicos
function normalizeAllergies(allergies: any): string {
  if (Array.isArray(allergies)) {
    return allergies
      .map((a: any) => (typeof a === "string" ? a : a?.name ?? ""))
      .filter(Boolean)
      .join(", ");
  }
  if (typeof allergies === "object" && allergies !== null) {
    return allergies.name ?? "";
  }
  return String(allergies ?? "");
}

function normalizeMedicalHistory(medical_history: any): string {
  if (Array.isArray(medical_history)) {
    return medical_history
      .map((m: any) =>
        typeof m === "string"
          ? m
          : m?.condition ?? m?.name ?? m?.title ?? ""
      )
      .filter(Boolean)
      .join(", ");
  }
  if (typeof medical_history === "object" && medical_history !== null) {
    return medical_history.condition ?? medical_history.name ?? medical_history.title ?? "";
  }
  return String(medical_history ?? "");
}

// 🔹 Transformación estricta para PatientHeader
function toPatientHeaderPatient(p: any): PatientsPatient & { balance_due?: number; age?: number | null } {
  const full_name =
    p.full_name ??
    [p.first_name, p.middle_name, p.last_name, p.second_last_name].filter(Boolean).join(" ").trim();

  const age = p.age ?? calcAge(p.birthdate ?? null);

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

    allergies: normalizeAllergies(p.allergies),
    medical_history: normalizeMedicalHistory(p.medical_history),

    active: p.active ?? true,
    created_at: p.created_at ?? null,
    updated_at: p.updated_at ?? null,
    full_name,
    balance_due: p.balance_due ?? undefined,
    age,
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
    return <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">Ruta inválida: parámetros incorrectos</p>;
  }

  if (isLoading) return <p className="text-xs sm:text-sm text-[#0d2c53] dark:text-gray-400">Cargando consulta...</p>;
  if (error) return <p className="text-xs sm:text-sm text-red-600">Error cargando consulta</p>;
  if (!appointment) return <p className="text-xs sm:text-sm text-red-600">No se encontró la consulta</p>;

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
    <div className="p-3 sm:p-5 space-y-3 sm:space-y-5">
      <div
        className={`p-2 sm:p-3 rounded-md text-center font-semibold shadow-sm ${
          readOnly
            ? "bg-gray-100 text-[#0d2c53] dark:bg-gray-800 dark:text-gray-300"
            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-200"
        }`}
      >
        {readOnly
          ? "Modo lectura — Consulta bloqueada"
          : "⚠️ Modo edición activa — Cambios en curso"}
      </div>

      {/* 🔹 Header compacto */}
      <div className="rounded-lg shadow-md p-3 sm:p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <PatientHeader patient={toPatientHeaderPatient(appointment.patient)} />
      </div>

      {/* 🔹 Mobile/Tablet */}
      <div className="lg:hidden space-y-3">
        <div className="rounded-lg shadow-lg p-3 sm:p-4 bg-white dark:bg-gray-800">
          <DocumentsPanel
            patientId={appointment.patient.id}
            appointmentId={appointment.id}
            readOnly={readOnly}
          />
        </div>

        <div className="rounded-lg shadow-lg p-3 sm:p-4 bg-white dark:bg-gray-800">
          <ChargeOrderPanel
            appointmentId={appointment.id}
            chargeOrder={appointment.charge_order}
            readOnly={readOnly}
          />
        </div>

        <div className="rounded-lg shadow-lg p-3 sm:p-4 bg-white dark:bg-gray-800">
          <ConsultationWorkflow
            diagnoses={appointment.diagnoses}
            appointmentId={appointment.id}
            notes={appointment.notes ?? null}
            readOnly={readOnly}
          />
        </div>

        {/* 🔹 Botones */}
        <div className="flex flex-wrap justify-end gap-2 sm:gap-3 mt-3">
          {canGenerateReport && (
            <>
              <button
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-md bg-[#0d2c53] text-white border border-[#0d2c53] hover:bg-[#0b2444] transition-colors text-xs sm:text-sm"
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
                  className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-md bg-gray-100 text-[#0d2c53] border border-gray-300 hover:bg-gray-200 transition-colors text-xs sm:text-sm"
                >
                  Ver Informe Médico
                </a>
              )}
                            <button
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors text-xs sm:text-sm"
                disabled={generateDocuments.isPending}
                onClick={handleGenerateDocuments}
              >
                {generateDocuments.isPending
                  ? "Generando..."
                  : "Generar Documentos"}
              </button>
            </>
          )}

          <button
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-md bg-yellow-600 text-white hover:bg-yellow-700 transition-colors text-xs sm:text-sm"
            onClick={() => setReadOnly((prev) => !prev)}
          >
            {readOnly ? "Activar edición" : "Cerrar edición"}
          </button>
        </div>
      </div>

      {/* 🔹 Desktop */}
      <div className="hidden lg:grid lg:grid-cols-12 lg:gap-5">
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

        <div className="col-span-9 relative pb-16">
          <ConsultationWorkflow
            diagnoses={appointment.diagnoses}
            appointmentId={appointment.id}
            notes={appointment.notes ?? null}
            readOnly={readOnly}
          />

          {/* 🔹 Botones alineados en esquina inferior derecha */}
          <div className="absolute bottom-0 right-0 flex flex-wrap justify-end gap-2 sm:gap-3">
            {canGenerateReport && (
              <>
                <button
                  className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-md bg-[#0d2c53] text-white border border-[#0d2c53] hover:bg-[#0b2444] transition-colors text-xs sm:text-sm"
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
                    className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-md bg-gray-100 text-[#0d2c53] border border-gray-300 hover:bg-gray-200 transition-colors text-xs sm:text-sm"
                  >
                    Ver Informe Médico
                  </a>
                )}

                <button
                  className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors text-xs sm:text-sm"
                  disabled={generateDocuments.isPending}
                  onClick={handleGenerateDocuments}
                >
                  {generateDocuments.isPending
                    ? "Generando..."
                    : "Generar Documentos"}
                </button>
              </>
            )}

            <button
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-md bg-yellow-600 text-white hover:bg-yellow-700 transition-colors text-xs sm:text-sm"
              onClick={() => setReadOnly((prev) => !prev)}
            >
              {readOnly ? "Activar edición" : "Cerrar edición"}
            </button>
          </div>
        </div>
      </div>

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
