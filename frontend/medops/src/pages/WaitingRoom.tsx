import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getWaitingRoom, updateWaitingRoomStatus } from "../api/waitingRoom";
import { WaitingRoomEntry, PatientStatus } from "../types";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export default function WaitingRoom() {
  const [entries, setEntries] = useState<WaitingRoomEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal de historial y notas
  const [selectedPatient, setSelectedPatient] = useState<WaitingRoomEntry | null>(null);
  const [notes, setNotes] = useState<string>("");

  // Modal de ingreso (walk-in o pre-registro)
  const [showIngreso, setShowIngreso] = useState(false);
  const [newPatientName, setNewPatientName] = useState("");

  useEffect(() => {
    getWaitingRoom()
      .then(data => setEntries(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (id: number, newStatus: PatientStatus) => {
    try {
      const updated = await updateWaitingRoomStatus(id, newStatus);
      setEntries(prev => prev.map(e => (e.id === id ? updated : e)));
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Separar grupos
  const confirmed = entries.filter(
    e => e.status === "waiting" || e.status === "in_consultation"
  );
  const scheduled = entries.filter(e => e.status === "scheduled");

  return (
    <div>
      <h2>Sala de Espera</h2>

      {/* Botón de ingreso */}
      <div style={{ marginBottom: "16px", textAlign: "right" }}>
        <button
          style={{
            background: "#22c55e",
            color: "#fff",
            padding: "8px 16px",
            borderRadius: "6px",
          }}
          onClick={() => setShowIngreso(true)}
        >
          ➕ Registrar llegada
        </button>
      </div>

      {loading && <p>Cargando...</p>}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      {/* Grupo A: Confirmados */}
      <h3>🟢 Pacientes en sala de espera</h3>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
        <thead>
          <tr style={{ background: "#e2e8f0" }}>
            <th>Paciente</th>
            <th>Estado</th>
            <th>Tiempo de espera</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {confirmed.map(e => (
            <tr key={e.id} style={{ borderBottom: "1px solid #cbd5e1" }}>
              <td>{e.patient.name}</td>
              <td>{e.status}</td>
              <td>
                {e.arrival_time
                  ? formatDistanceToNow(new Date(e.arrival_time), {
                      addSuffix: false,
                      locale: es,
                    })
                  : "—"}
              </td>
              <td>
                <button onClick={() => setSelectedPatient(e)}>Ver historial</button>
                {e.status === "waiting" && (
                  <button onClick={() => handleStatusChange(e.id, "in_consultation")}>
                    Pasar a consulta
                  </button>
                )}
                {e.status === "in_consultation" && (
                  <button onClick={() => handleStatusChange(e.id, "completed")}>
                    Finalizar
                  </button>
                )}
                <button
                  onClick={() => handleStatusChange(e.id, "canceled")}
                  style={{ color: "red" }}
                >
                  Cancelar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Separador visual */}
      <div
        style={{
          background: "#f1f5f9",
          padding: "6px",
          textAlign: "center",
          margin: "12px 0",
        }}
      >
        📅 Pacientes con cita pendiente de confirmar
      </div>

      {/* Grupo B: Scheduled */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#e2e8f0" }}>
            <th>Paciente</th>
            <th>Estado</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {scheduled.map(e => (
            <tr key={e.id} style={{ borderBottom: "1px solid #cbd5e1" }}>
              <td>{e.patient.name}</td>
              <td>{e.status}</td>
              <td>
                <button onClick={() => handleStatusChange(e.id, "waiting")}>
                  Confirmar llegada
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal historial */}
      {selectedPatient && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: "20px",
              borderRadius: "8px",
              width: "400px",
            }}
          >
            <h3>Historial de {selectedPatient.patient.name}</h3>
            <p>
              <b>Estado:</b> {selectedPatient.status}
            </p>
            <p>
              <b>Llegada:</b> {selectedPatient.arrival_time || "—"}
            </p>
            <textarea
              placeholder="Escribe una nota rápida..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              style={{ width: "100%", minHeight: "80px", marginTop: "10px" }}
            />
            <div style={{ marginTop: "12px", textAlign: "right" }}>
              <button
                onClick={() => {
                  alert("Nota guardada (simulado)");
                  setSelectedPatient(null);
                }}
              >
                Guardar nota
              </button>
              <button onClick={() => setSelectedPatient(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ingreso */}
      {showIngreso && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: "20px",
              borderRadius: "8px",
              width: "500px",
            }}
          >
            <h3>Registrar llegada</h3>
            <p>🔍 Buscar paciente existente o registrar nuevo</p>
            <input
              type="text"
              placeholder="Nombre del paciente"
              value={newPatientName}
              onChange={e => setNewPatientName(e.target.value)}
              style={{ width: "100%", padding: "8px", marginBottom: "12px" }}
            />
            <div style={{ marginTop: "12px", textAlign: "right" }}>
              <button
                onClick={() => {
                  if (newPatientName.trim()) {
                    const newEntry: WaitingRoomEntry = {
                      id: Date.now(),
                      patient: { id: Date.now(), name: newPatientName },
                      appointment_id: null,
                      status: "waiting",
                      arrival_time: new Date().toISOString(),
                      priority: "normal",
                      order: entries.length + 1,
                    };
                    setEntries(prev => [...prev, newEntry]);
                    setNewPatientName("");
                    setShowIngreso(false);
                  }
                }}
                style={{
                  marginRight: "8px",
                  background: "#22c55e",
                  color: "#fff",
                  padding: "6px 12px",
                }}
              >
                Registrar
              </button>
              <button onClick={() => setShowIngreso(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
