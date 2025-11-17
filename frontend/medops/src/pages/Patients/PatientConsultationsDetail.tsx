// src/pages/Patients/PatientConsultationsDetail.tsx
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useConsultationById } from "../../hooks/consultations/useConsultationById";
import {
  DiagnosisPanel,
  TreatmentPanel,
  PrescriptionPanel,
  NotesPanel,
  DocumentsPanel,
  ChargeOrderPanel,
} from "../../components/Consultation";
import { ChargeOrder } from "../../types/payments"; // ✅ tipado fuerte

export default function PatientConsultationsDetail() {
  const { id, consultationId } = useParams<{ id: string; consultationId: string }>();
  const patientId = Number(id);
  const cId = Number(consultationId);

  const { data: consultation, isLoading, error } = useConsultationById(cId);

  // 🔹 Estado persistente en localStorage
  const [readOnly, setReadOnly] = useState<boolean>(() => {
    const saved = localStorage.getItem("consultationReadOnly");
    return saved ? JSON.parse(saved) : true;
  });
  useEffect(() => {
    localStorage.setItem("consultationReadOnly", JSON.stringify(readOnly));
  }, [readOnly]);

  // 🔹 Log institucional de acciones
  const [actionsLog, setActionsLog] = useState<string[]>([]);
  const logAction = (msg: string) => {
    setActionsLog((prev) => [...prev, `${new Date().toLocaleTimeString()} — ${msg}`]);
  };

  if (isLoading) return <p>Cargando consulta...</p>;
  if (error) return <p className="text-danger">Error cargando consulta</p>;
  if (!consultation) return <p>No se encontró la consulta</p>;

  // 🔹 Callbacks para modo write
  const handleAddTreatment = (data: any) => {
    logAction(`Tratamiento agregado: ${data.plan}`);
    // Aquí llamas tu hook useCreateTreatment o mutación real
  };
  const handleAddPrescription = (data: any) => {
    logAction(
      `Prescripción agregada: ${
        data.medication_text || "Medicamento catálogo #" + data.medication_catalog
      }`
    );
    // Aquí llamas tu hook useCreatePrescription o mutación real
  };

  return (
    <div className="page">
      {/* 🔹 Banner institucional */}
      <div
        className={`p-2 mb-4 text-center font-semibold ${
          readOnly ? "bg-gray-200 text-gray-700" : "bg-yellow-100 text-yellow-800"
        }`}
      >
        {readOnly
          ? "Modo lectura — Consulta bloqueada"
          : "⚠️ Modo edición activa — Cambios en curso"}
      </div>

      <div className="page-header flex justify-between items-center">
        <div>
          <h2>Consulta del Paciente</h2>
          <h3 className="text-muted">
            Paciente #{patientId} — Consulta #{consultation.id}
          </h3>
        </div>
        <button className="btn-secondary" onClick={() => setReadOnly((prev) => !prev)}>
          {readOnly ? "Editar consulta" : "Cerrar edición"}
        </button>
      </div>

      <div className="consultation-container">
        {/* 🔹 Columna izquierda: Documentos */}
        <div className="consultation-column">
          <div className="consultation-card">
            <DocumentsPanel
              patientId={patientId}
              appointmentId={consultation.id}
              readOnly={readOnly}
            />
          </div>
        </div>

        {/* 🔹 Columna central: flujo clínico */}
        <div className="consultation-main">
          <div className="consultation-tabs">
            <DiagnosisPanel diagnoses={consultation.diagnoses} readOnly={readOnly} />
            <TreatmentPanel
              diagnoses={consultation.diagnoses}
              appointmentId={consultation.id}
              treatments={consultation.treatments}
              readOnly={readOnly}
              onAdd={!readOnly ? handleAddTreatment : undefined}
            />
            <PrescriptionPanel
              diagnoses={consultation.diagnoses}
              prescriptions={consultation.prescriptions}
              readOnly={readOnly}
              onAdd={!readOnly ? handleAddPrescription : undefined}
            />
            <NotesPanel
              appointmentId={consultation.id}
              notes={consultation.notes ?? ""}
              readOnly={readOnly}
            />
          </div>
        </div>

        {/* 🔹 Columna derecha: orden de cobro */}
        <div className="consultation-column">
          <div className="consultation-card">
            {consultation.charge_order ? (
              <ChargeOrderPanel
                chargeOrder={consultation.charge_order as ChargeOrder} // ✅ tipado fuerte
                readOnly={readOnly}
              />
            ) : (
              <p className="text-muted">No hay orden de cobro asociada</p>
            )}
          </div>
        </div>
      </div>

      {/* 🔹 Log visual institucional */}
      {actionsLog.length > 0 && (
        <div className="mt-6 p-3 border rounded bg-gray-50">
          <h4 className="font-semibold mb-2">Registro de acciones</h4>
          <ul className="text-sm text-muted">
            {actionsLog.map((log, idx) => (
              <li key={idx}>{log}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
