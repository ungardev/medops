// src/pages/PatientDetail.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPatient } from "api/patients";
import { getPaymentsByPatient } from "api/payments";
import { Patient } from "types/patients";
import { Payment } from "types/payments";
import { useAppointmentsByPatient } from "../hooks/useAppointmentsByPatient";
import { useDocumentsByPatient } from "../hooks/useDocumentsByPatient";
import { useEventsByPatient } from "../hooks/useEventsByPatient";

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "consultas" | "pagos" | "documentos" | "eventos">("info");

  const { data: appointments, isLoading: loadingAppointments } = useAppointmentsByPatient(Number(id));
  const { data: documents, isLoading: loadingDocuments } = useDocumentsByPatient(Number(id));
  const { data: events, isLoading: loadingEvents } = useEventsByPatient(Number(id));

  useEffect(() => {
    if (!id) return;
    getPatient(Number(id))
      .then(setPatient)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

    getPaymentsByPatient(Number(id))
      .then(setPayments)
      .catch(() => setPayments([]))
      .finally(() => setLoadingPayments(false));
  }, [id]);

  if (loading) return <p>Cargando paciente...</p>;
  if (error) return <p className="text-danger">Error: {error}</p>;
  if (!patient) return <p>No se encontró el paciente</p>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Detalle del Paciente</h2>
          <h3 className="text-muted">{patient.full_name}</h3>
        </div>
      </div>

      <div className="actions mb-4">
        <button className={activeTab === "info" ? "btn btn-primary-compact" : "btn btn-outline"} onClick={() => setActiveTab("info")}>Información</button>
        <button className={activeTab === "consultas" ? "btn btn-primary-compact" : "btn btn-outline"} onClick={() => setActiveTab("consultas")}>Consultas</button>
        <button className={activeTab === "pagos" ? "btn btn-primary-compact" : "btn btn-outline"} onClick={() => setActiveTab("pagos")}>Pagos</button>
        <button className={activeTab === "documentos" ? "btn btn-primary-compact" : "btn btn-outline"} onClick={() => setActiveTab("documentos")}>Documentos</button>
        <button className={activeTab === "eventos" ? "btn btn-primary-compact" : "btn btn-outline"} onClick={() => setActiveTab("eventos")}>Eventos</button>
      </div>

      {/* TAB INFORMACIÓN */}
      {activeTab === "info" && (
        <div className="card">
          <p><strong>Cédula:</strong> {patient.national_id || "—"}</p>
          <p><strong>Fecha de nacimiento:</strong> {patient.birthdate || "—"}</p>
          <p><strong>Género:</strong> {patient.gender}</p>
          <p><strong>Contacto:</strong> {patient.contact_info || "—"}</p>
          <p><strong>Email:</strong> {patient.email || "—"}</p>
          <p><strong>Dirección:</strong> {patient.address || "—"}</p>
          <p><strong>Peso:</strong> {patient.weight ? `${patient.weight} kg` : "—"}</p>
          <p><strong>Altura:</strong> {patient.height ? `${patient.height} cm` : "—"}</p>
          <p><strong>Tipo de sangre:</strong> {patient.blood_type || "—"}</p>
          <p><strong>Alergias:</strong> {patient.allergies || "—"}</p>
          <p><strong>Historial médico:</strong> {patient.medical_history || "—"}</p>
        </div>
      )}

      {/* TAB CONSULTAS */}
      {activeTab === "consultas" && (
        <div className="card">
          <h3>Consultas del paciente</h3>
          {loadingAppointments && <p>Cargando consultas...</p>}
          {!loadingAppointments && appointments && appointments.length === 0 && <p>No hay consultas registradas.</p>}
          {!loadingAppointments && appointments && appointments.length > 0 && (
            <div className="consultas-list">
              {appointments.map((appt) => (
                <div key={appt.id} className="consulta-item mb-4">
                  <h4>{appt.appointment_date} — {appt.appointment_type} ({appt.status})</h4>
                  <p><strong>Monto esperado:</strong> {appt.expected_amount}</p>
                  <p><strong>Notas:</strong> {appt.notes || "—"}</p>
                  {appt.diagnoses.length > 0 && (
                    <div className="diagnoses mt-2">
                      <h5>Diagnósticos</h5>
                      {appt.diagnoses.map((dx) => (
                        <div key={dx.id} className="diagnosis mb-2">
                          <p><strong>{dx.code}</strong> — {dx.description || "—"}</p>
                          {dx.treatments.length > 0 && (
                            <div className="treatments ml-3">
                              <h6>Tratamientos</h6>
                              <ul>
                                {dx.treatments.map((t) => (
                                  <li key={t.id}>{t.plan} ({t.start_date || "—"} → {t.end_date || "—"})</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {dx.prescriptions.length > 0 && (
                            <div className="prescriptions ml-3">
                              <h6>Prescripciones</h6>
                              <ul>
                                {dx.prescriptions.map((p) => (
                                  <li key={p.id}>{p.medication} — {p.dosage || "—"} ({p.duration || "—"})</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
            {/* TAB PAGOS */}
      {activeTab === "pagos" && (
        <div className="card">
          <h3>Pagos del paciente</h3>
          {loadingPayments && <p>Cargando pagos...</p>}
          {!loadingPayments && payments.length === 0 && <p>No hay pagos registrados.</p>}
          {!loadingPayments && payments.length > 0 && (
            <table className="table">
              <thead>
                <tr>
                  <th>Cita</th>
                  <th>Monto</th>
                  <th>Método</th>
                  <th>Estado</th>
                  <th>Referencia</th>
                  <th>Banco</th>
                  <th>Recibido por</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((pay) => (
                  <tr key={pay.id}>
                    <td>{pay.appointment || "—"}</td>
                    <td>{pay.amount}</td>
                    <td>{pay.method}</td>
                    <td>{pay.status}</td>
                    <td>{pay.reference_number || "—"}</td>
                    <td>{pay.bank_name || "—"}</td>
                    <td>{pay.received_by || "—"}</td>
                    <td>{pay.received_at ? new Date(pay.received_at).toLocaleString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TAB DOCUMENTOS */}
      {activeTab === "documentos" && (
        <div className="card">
          <h3>Documentos clínicos</h3>
          {loadingDocuments && <p>Cargando documentos...</p>}
          {!loadingDocuments && documents && documents.length === 0 && <p>No hay documentos registrados.</p>}
          {!loadingDocuments && documents && documents.length > 0 && (
            <table className="table">
              <thead>
                <tr>
                  <th>Descripción</th>
                  <th>Categoría</th>
                  <th>Subido por</th>
                  <th>Fecha</th>
                  <th>Archivo</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id}>
                    <td>{doc.description || "—"}</td>
                    <td>{doc.category || "—"}</td>
                    <td>{doc.uploaded_by || "—"}</td>
                    <td>{new Date(doc.uploaded_at).toLocaleString()}</td>
                    <td>
                      <a href={doc.file} target="_blank" rel="noopener noreferrer">
                        Descargar
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TAB EVENTOS */}
      {activeTab === "eventos" && (
        <div className="card">
          <h3>Eventos / Auditoría</h3>
          {loadingEvents && <p>Cargando eventos...</p>}
          {!loadingEvents && events && events.length === 0 && <p>No hay eventos registrados.</p>}
          {!loadingEvents && events && events.length > 0 && (
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Actor</th>
                  <th>Entidad</th>
                  <th>Acción</th>
                  <th>Metadata</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => (
                  <tr key={ev.id}>
                    <td>{new Date(ev.timestamp).toLocaleString()}</td>
                    <td>{ev.actor || "—"}</td>
                    <td>{ev.entity} ({ev.entity_id})</td>
                    <td>{ev.action}</td>
                    <td>{ev.metadata ? JSON.stringify(ev.metadata) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
