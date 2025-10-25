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
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));

    getPaymentsByPatient(Number(id))
      .then(setPayments)
      .catch(() => setPayments([]))
      .finally(() => setLoadingPayments(false));
  }, [id]);

  if (loading) return <p>Cargando paciente...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;
  if (!patient) return <p>No se encontró el paciente</p>;

  return (
    <div>
      <h2>Detalle del Paciente</h2>
      <h3>{patient.full_name}</h3> {/* 🔹 ahora usamos name */}

      <div style={{ marginBottom: "1rem" }}>
        <button
          onClick={() => setActiveTab("info")}
          style={{ marginRight: "8px", fontWeight: activeTab === "info" ? "bold" : "normal" }}
        >
          Información
        </button>
        <button
          onClick={() => setActiveTab("pagos")}
          style={{ fontWeight: activeTab === "pagos" ? "bold" : "normal" }}
        >
          Pagos
        </button>
      </div>
      {/* Información */}
      {activeTab === "info" && (
        <div>
          <p><strong>ID:</strong> {patient.id}</p>
          <p><strong>Cédula:</strong> {patient.national_id || "—"}</p>
          <p><strong>Nombre:</strong> {patient.full_name}</p> {/* 🔹 usamos name */}
          <p><strong>Fecha de nacimiento:</strong> {patient.birthdate || "—"}</p>
          <p><strong>Género:</strong> {patient.gender}</p>
          <p><strong>Contacto:</strong> {patient.contact_info || "—"}</p>
        </div>
      )}
      {/* Pagos */}
      {activeTab === "pagos" && (
        <div>
          <h3>Pagos del paciente</h3>
          {loadingPayments && <p>Cargando pagos...</p>}
          {!loadingPayments && payments && payments.length === 0 && <p>No hay pagos registrados.</p>}
          {!loadingPayments && payments && payments.length > 0 && (
            <table>
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
                    <td>
                      {pay.received_at ? new Date(pay.received_at).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p style={{ marginTop: "1rem" }}>
            👉 Para gestión completa de pagos, dirígete al módulo <strong>/payments</strong>.
          </p>
        </div>
      )}
    </div>
  );
}
