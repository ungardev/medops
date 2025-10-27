// src/pages/PatientDetail.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPatient } from "api/patients";
import { getPaymentsByPatient } from "api/payments";
import { Patient } from "types/patients";
import { Payment } from "types/payments";

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "pagos">("info");

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
        <button
          className={activeTab === "info" ? "btn btn-primary-compact" : "btn btn-outline"}
          onClick={() => setActiveTab("info")}
        >
          Información
        </button>
        <button
          className={activeTab === "pagos" ? "btn btn-primary-compact" : "btn btn-outline"}
          onClick={() => setActiveTab("pagos")}
        >
          Pagos
        </button>
      </div>

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
          <p className="mt-3 text-muted">
            👉 Para gestión completa de pagos, dirígete al módulo <strong>/payments</strong>.
          </p>
        </div>
      )}
    </div>
  );
}
