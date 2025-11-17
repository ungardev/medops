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
import { ChargeOrder } from "../../types/payments";

export default function PatientConsultationsDetail() {
  const { id, consultationId } = useParams<{ id: string; consultationId: string }>();
  const patientId = Number(id);
  const appointmentId = Number(consultationId);

  console.debug("🔍 Params recibidos:", { id, consultationId });
  console.debug("🔍 IDs numéricos:", { patientId, appointmentId });

  const { data: consultation, isLoading, error } = useConsultationById(appointmentId);

  useEffect(() => {
    console.debug("📦 Consulta recibida:", consultation);
  }, [consultation]);

  const [readOnly, setReadOnly] = useState<boolean>(() => {
    const saved = localStorage.getItem("consultationReadOnly");
    return saved ? JSON.parse(saved) : true;
  });
  useEffect(() => {
    localStorage.setItem("consultationReadOnly", JSON.stringify(readOnly));
  }, [readOnly]);

  const [actionsLog, setActionsLog] = useState<string[]>([]);
  const logAction = (msg: string) => {
    setActionsLog((prev) => [...prev, `${new Date().toLocaleTimeString()} — ${msg}`]);
  };

  if (!id || !consultationId || isNaN(patientId) || isNaN(appointmentId)) {
    console.warn("⚠️ Parámetros inválidos:", { id, consultationId });
    return <p className="text-danger">Ruta inválida: parámetros incorrectos</p>;
  }

  if (isLoading) return <p>Cargando consulta...</p>;
  if (error) {
    console.error("❌ Error en hook:", error);
    return <p className="text-danger">Error cargando consulta</p>;
  }
  if (!consultation || !consultation.id) {
    console.warn("⚠️ Consulta no encontrada o sin ID:", consultation);
    return <p>No se encontró la consulta</p>;
  }

  const handleAddTreatment = (data: any) => {
    logAction(`Tratamiento agregado: ${data.plan}`);
  };
  const handleAddPrescription = (data: any) => {
    logAction(
      `Prescripción agregada: ${
        data.medication_text || "Medicamento catálogo #" + data.medication_catalog
      }`
    );
  };

  return (
    <div className="page">
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
        <div className="consultation-column">
          <div className="consultation-card">
            <DocumentsPanel
              patientId={patientId}
              appointmentId={consultation.id}
              readOnly={readOnly}
            />
          </div>
        </div>

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

        <div className="consultation-column">
          <div className="consultation-card">
            {consultation.charge_order ? (
              <ChargeOrderPanel
                chargeOrder={consultation.charge_order as ChargeOrder}
                readOnly={readOnly}
              />
            ) : (
              <p className="text-muted">No hay orden de cobro asociada</p>
            )}
          </div>
        </div>
      </div>

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
