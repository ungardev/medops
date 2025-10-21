import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchWaitingRoom, updateAppointmentStatus } from "../api/waitingRoom";

interface PatientRef {
  id: number;
  name: string;
}

interface WaitingRoomEntry {
  id: number;
  patient: PatientRef;     // 🔹 ahora es un objeto con id y name
  appointment: number;     // id de la cita asociada
  status: string;
  created_at: string;
  updated_at: string;
}

export default function WaitingRoom() {
  const [entries, setEntries] = useState<WaitingRoomEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWaitingRoom()
      .then(data => setEntries(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await updateAppointmentStatus(id, newStatus); // PATCH al backend
      setEntries(prev =>
        prev.map(e => (e.id === id ? { ...e, status: newStatus } : e))
      );
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <p>Cargando sala de espera...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;

  return (
    <div>
      <h2>Sala de Espera</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#e2e8f0" }}>
            <th>Paciente</th>
            <th>Estado</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(e => (
            <tr key={e.id} style={{ borderBottom: "1px solid #cbd5e1" }}>
              <td>{e.patient.name}</td> {/* 🔹 usamos directamente el nombre del backend */}
              <td>{e.status}</td>
              <td>
                {e.status === "pending" && (
                  <button onClick={() => handleStatusChange(e.id, "arrived")}>
                    Marcar llegada
                  </button>
                )}
                {e.status === "arrived" && (
                  <>
                    <button
                      onClick={() => handleStatusChange(e.id, "in_consultation")}
                    >
                      Iniciar consulta
                    </button>
                    <button
                      onClick={() => handleStatusChange(e.id, "canceled")}
                      style={{ marginLeft: "6px", color: "red" }}
                    >
                      Cancelar
                    </button>
                  </>
                )}
                {e.status === "in_consultation" && (
                  <>
                    <Link
                      to={`/consulta/${e.appointment}`}
                      style={{
                        background: "#3b82f6",
                        color: "#fff",
                        padding: "6px 12px",
                        borderRadius: "4px",
                        textDecoration: "none",
                        marginRight: "6px"
                      }}
                    >
                      Ir a consulta
                    </Link>
                    <button
                      onClick={() => handleStatusChange(e.id, "completed")}
                    >
                      Finalizar
                    </button>
                  </>
                )}
                {e.status === "completed" && <span>✔ Finalizada</span>}
                {e.status === "canceled" && <span>✖ Cancelada</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
