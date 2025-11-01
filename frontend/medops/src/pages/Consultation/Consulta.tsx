import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  fetchAppointmentDetail,
  updateAppointmentStatus,
  updateAppointmentNotes,
} from "../../api/appointments";
import { getAuditByAppointment, AuditEvent } from "../../api/audit";
import { Appointment } from "../../types/appointments"; // ✅ usamos el tipo oficial

export default function Consulta() {
  const { id } = useParams<{ id: string }>();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Auditoría
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [showAudit, setShowAudit] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchAppointmentDetail(Number(id))
      .then((data: Appointment) => {
        setAppointment(data);
        setNotes(data.notes || "");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSaveNotes = async () => {
    if (!appointment) return;
    setSaving(true);
    try {
      const updated = await updateAppointmentNotes(appointment.id, notes);
      setAppointment(updated);
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    if (!appointment) return;
    const updated: Appointment = await updateAppointmentStatus(
      appointment.id,
      "completed"
    );
    setAppointment(updated);
  };

  const loadAudit = async () => {
    if (!appointment) return;
    const events = await getAuditByAppointment(appointment.id);
    setAuditEvents(events);
    setShowAudit(true);
  };

  if (loading) return <p>Cargando consulta...</p>;
  if (!appointment) return <p>No se encontró la cita</p>;

  return (
    <div>
      <h2>Consulta del paciente</h2>
      <div
        style={{ marginBottom: "20px", padding: "10px", background: "#f1f5f9" }}
      >
        <p>
          <strong>Paciente:</strong> {appointment.patient.full_name}
        </p>
        <p>
          <strong>Fecha:</strong> {appointment.appointment_date}
        </p>
        <p>
          <strong>Tipo:</strong> {appointment.appointment_type}
        </p>
        <p>
          <strong>Estado:</strong> {appointment.status}
        </p>
        <p>
          <strong>Monto esperado:</strong> ${appointment.expected_amount}
        </p>
      </div>

      <h3>Evolución</h3>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={6}
        style={{ width: "100%", marginBottom: "12px" }}
        placeholder="Escriba aquí la evolución clínica..."
      />

      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={handleSaveNotes}
          disabled={saving}
          style={{
            background: "#3b82f6",
            color: "#fff",
            padding: "8px 16px",
            marginRight: "8px",
          }}
        >
          {saving ? "Guardando..." : "Guardar notas"}
        </button>
        <button
          onClick={handleComplete}
          disabled={appointment.status === "completed"}
          style={{ background: "#10b981", color: "#fff", padding: "8px 16px" }}
        >
          Finalizar consulta
        </button>
        <button
          onClick={loadAudit}
          style={{
            marginLeft: "8px",
            background: "#6b7280",
            color: "#fff",
            padding: "8px 16px",
          }}
        >
          Ver historial
        </button>
      </div>

      {showAudit && (
        <div
          style={{
            background: "#f9fafb",
            padding: "12px",
            marginTop: "16px",
            borderRadius: "6px",
          }}
        >
          <h4>Historial de cambios</h4>
          <ul>
            {auditEvents.map((ev) => (
              <li key={ev.id}>
                [{new Date(ev.timestamp).toLocaleString()}] {ev.actor} →{" "}
                {ev.action}
              </li>
            ))}
          </ul>
          <button onClick={() => setShowAudit(false)}>Cerrar</button>
        </div>
      )}
    </div>
  );
}
