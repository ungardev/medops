import { useEffect, useState } from "react";
import {
  getWaitingRoomGroupsToday,
  updateWaitingRoomStatus,
  createWaitingRoomEntry,
  promoteToEmergency,
  confirmWaitingRoomEntry,
  closeWaitingRoomDay,
  registerWalkinEntry,   // 👈 nuevo servicio para registrar walk-in
} from "../api/waitingRoom";
import { searchPatients } from "../api/patients";
import { WaitingRoomEntry, WaitingRoomStatus } from "../types/waitingRoom";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

// 🔹 Badge visual para estado
const renderStatusBadge = (status: WaitingRoomStatus) => {
  const styles: Record<string, { bg: string; text: string }> = {
    waiting: { bg: "#facc15", text: "En espera" },
    in_consultation: { bg: "#3b82f6", text: "En consulta" },
    completed: { bg: "#22c55e", text: "Completado" },
    canceled: { bg: "#ef4444", text: "Cancelado" },
    pending: { bg: "#6b7280", text: "Pendiente" },
  };
  const style = styles[status] || { bg: "#9ca3af", text: status };
  return (
    <span
      style={{
        background: style.bg,
        color: "#fff",
        padding: "2px 8px",
        borderRadius: "12px",
      }}
    >
      {style.text}
    </span>
  );
};

// 🔹 Badge visual para prioridad
const renderPriorityBadge = (priority?: string) => {
  const styles: Record<string, { bg: string; text: string }> = {
    normal: { bg: "#0ea5e9", text: "Normal" },
    emergency: { bg: "#dc2626", text: "Emergencia" },
    walkin: { bg: "#a855f7", text: "Walk-in" },
    scheduled: { bg: "#0ea5e9", text: "Programado" },
  };
  const style = styles[priority ?? ""] || { bg: "#6b7280", text: priority || "—" };
  return (
    <span
      style={{
        background: style.bg,
        color: "#fff",
        padding: "2px 8px",
        borderRadius: "12px",
        marginLeft: "6px",
      }}
    >
      {style.text}
    </span>
  );
};

export default function WaitingRoom() {
  const [grupoA, setGrupoA] = useState<WaitingRoomEntry[]>([]);
  const [grupoB, setGrupoB] = useState<WaitingRoomEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getWaitingRoomGroupsToday()
      .then((data) => {
        setGrupoA(data.grupo_a);
        setGrupoB(data.grupo_b);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (id: number, newStatus: WaitingRoomStatus) => {
    try {
      const updated = await updateWaitingRoomStatus(id, newStatus);
      setGrupoA((prev) => prev.map((e) => (e.id === id ? updated : e)));
      setGrupoB((prev) => prev.map((e) => (e.id === id ? updated : e)));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handlePromoteToEmergency = async (id: number) => {
    try {
      const updated = await promoteToEmergency(id);
      setGrupoA((prev) => prev.map((e) => (e.id === id ? updated : e)));
      setGrupoB((prev) => prev.map((e) => (e.id === id ? updated : e)));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleConfirmWalkin = async (id: number) => {
    try {
      const updated = await confirmWaitingRoomEntry(id);
      setGrupoA((prev) => [...prev, updated]);
      setGrupoB((prev) => prev.filter((e) => e.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRegisterWalkin = async (patientId: number) => {
    try {
      const newEntry = await registerWalkinEntry(patientId);
      setGrupoB((prev) => [...prev, newEntry]);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCloseDay = async () => {
    try {
      await closeWaitingRoomDay();
      setGrupoA((prev) =>
        prev.map((e) => (e.status === "waiting" ? { ...e, status: "canceled" } : e))
      );
      setGrupoB((prev) =>
        prev.map((e) => (e.status === "waiting" ? { ...e, status: "canceled" } : e))
      );
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2>Sala de Espera</h2>

      <div style={{ marginBottom: "16px", textAlign: "right" }}>
        <button
          style={{
            background: "#22c55e",
            color: "#fff",
            padding: "8px 16px",
            borderRadius: "6px",
            marginRight: "8px",
          }}
          onClick={() => {
            // 👇 ejemplo: registrar walk-in con un paciente fijo (luego se conecta a un buscador)
            const patientId = 1; 
            handleRegisterWalkin(patientId);
          }}
        >
          ➕ Registrar llegada
        </button>
        <button
          style={{
            background: "#ef4444",
            color: "#fff",
            padding: "8px 16px",
            borderRadius: "6px",
          }}
          onClick={handleCloseDay}
        >
          🛑 Cerrar jornada
        </button>
      </div>

      <h3>Grupo A</h3>
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
          {grupoA.map((e) => (
            <tr key={e.id}>
              <td>{e.patient.name}</td>
              <td>
                {renderStatusBadge(e.status)} {renderPriorityBadge(e.priority)}
              </td>
              <td>
                {e.arrival_time
                  ? formatDistanceToNow(new Date(e.arrival_time), { locale: es })
                  : "—"}
              </td>
              <td>
                {e.status === "waiting" && (
                  <button
                    onClick={() => handleStatusChange(e.id, "in_consultation")}
                    style={{ marginRight: "6px" }}
                  >
                    Pasar a consulta
                  </button>
                )}
                {e.status === "in_consultation" && (
                  <button
                    onClick={() => handleStatusChange(e.id, "completed")}
                    style={{ background: "#22c55e", color: "#fff", marginRight: "6px" }}
                  >
                    ✅ Finalizar consulta
                  </button>
                )}
                {e.status === "completed" && (
                  <span style={{ color: "#22c55e", fontWeight: "bold" }}>
                    ✅ Consulta finalizada
                  </span>
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

      <h3>Grupo B</h3>
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
          {grupoB.map((e) => (
            <tr key={e.id} style={{ borderBottom: "1px solid #cbd5e1" }}>
              <td>{e.patient.name}</td>
              <td>
                {renderStatusBadge(e.status)}
                {renderPriorityBadge(e.priority)}
              </td>
              <td>
                {e.arrival_time
                  ? formatDistanceToNow(new Date(e.arrival_time), { locale: es })
                  : "—"}
              </td>
              <td>
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
                  style={{ color: "red", marginLeft: "6px" }}
                >
                  Cancelar
                </button>
                {e.priority !== "emergency" && (
                  <button
                    onClick={() => handlePromoteToEmergency(e.id)}
                    style={{ background: "#facc15", marginLeft: "6px" }}
                  >
                    🚨 Emergencia
                  </button>
                )}
                {(e.priority === "walkin" || e.status === "pending") && (
                  <button
                    onClick={() => handleConfirmWalkin(e.id)}
                    style={{
                      background: "#10b981",
                      color: "#fff",
                      marginLeft: "6px",
                      padding: "4px 8px",
                      borderRadius: "4px",
                    }}
                  >
                    Confirmar
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
