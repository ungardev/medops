import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useConsultationById } from "../../hooks/consultations/useConsultationById";
import {
  DocumentsPanel,
  ChargeOrderPanel,
  ConsultationDocumentsActions, // ✅ nuevo import
} from "../../components/Consultation";
import ConsultationWorkflow from "../../components/Consultation/ConsultationWorkflow";
import { ChargeOrder } from "../../types/payments";

export default function PatientConsultationsDetail() {
  const { patientId, appointmentId } = useParams<{ patientId: string; appointmentId: string }>();
  const patientIdNum = Number(patientId);
  const appointmentIdNum = Number(appointmentId);

  const { data: consultation, isLoading, error } = useConsultationById(appointmentIdNum);

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

  if (!patientId || !appointmentId || isNaN(patientIdNum) || isNaN(appointmentIdNum)) {
    return <p className="text-danger">Ruta inválida: parámetros incorrectos</p>;
  }

  if (isLoading) return <p>Cargando consulta...</p>;
  if (error) return <p className="text-danger">Error cargando consulta</p>;
  if (!consultation || !consultation.id) return <p>No se encontró la consulta</p>;

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
            Paciente #{patientIdNum} — Consulta #{consultation.id}
          </h3>
        </div>
        <button className="btn-secondary" onClick={() => setReadOnly((prev) => !prev)}>
          {readOnly ? "Editar consulta" : "Cerrar edición"}
        </button>
      </div>

      <div className="consultation-container">
        {/* Columna izquierda: Documentos */}
        <div className="consultation-column">
          <div className="consultation-card">
            <DocumentsPanel
              patientId={patientIdNum}
              appointmentId={consultation.id}
              readOnly={readOnly}
            />
          </div>
        </div>

        {/* Columna central: flujo clínico con pestañas */}
        <div className="consultation-main">
          <div className="consultation-tabs">
            <ConsultationWorkflow
              diagnoses={consultation.diagnoses}
              appointmentId={consultation.id}
              notes={consultation.notes ?? null}
              readOnly={readOnly}
            />
          </div>
        </div>

        {/* Columna derecha: orden de cobro + botones de generación */}
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

          <ConsultationDocumentsActions consultationId={consultation.id} />
        </div>
      </div>

      {/* Log visual institucional */}
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
