import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchAppointmentDetail, updateAppointmentStatus } from "../api/appointments";
import { Appointment } from "../types/appointments"; // ✅ usamos el tipo oficial

export default function Consulta() {
  const { id } = useParams<{ id: string }>();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!id) return;
    fetchAppointmentDetail(Number(id))
      .then((data: Appointment) => setAppointment(data)) // ✅ data tipado
      .finally(() => setLoading(false));
  }, [id]);

  const handleComplete = async () => {
    if (!appointment) return;
    const updated: Appointment = await updateAppointmentStatus(appointment.id, "completed"); // ✅ updated tipado
    setAppointment(updated);
  };

  if (loading) return <p>Cargando consulta...</p>;
  if (!appointment) return <p>No se encontró la cita</p>;

  return (
    <div>
      <h2>Consulta del paciente</h2>
      <div style={{ marginBottom: "20px", padding: "10px", background: "#f1f5f9" }}>
        <p><strong>Paciente:</strong> {appointment.patient.name}</p> {/* 🔹 cambio aquí */}
        <p><strong>Fecha:</strong> {appointment.appointment_date}</p>
        <p><strong>Tipo:</strong> {appointment.appointment_type}</p>
        <p><strong>Estado:</strong> {appointment.status}</p>
        <p><strong>Monto esperado:</strong> ${appointment.expected_amount}</p>
      </div>

      <h3>Evolución</h3>
      <textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        rows={6}
        style={{ width: "100%", marginBottom: "20px" }}
        placeholder="Escriba aquí la evolución clínica..."
      />

      <button
        onClick={handleComplete}
        disabled={appointment.status === "completed"}
        style={{ background: "#10b981", color: "#fff", padding: "8px 16px" }}
      >
        Finalizar consulta
      </button>
    </div>
  );
}
