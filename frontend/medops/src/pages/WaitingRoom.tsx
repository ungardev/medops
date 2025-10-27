import { useEffect, useState } from "react";
import {
  getWaitingRoomGroupsToday,
  updateWaitingRoomStatus,
  promoteToEmergency,
  confirmWaitingRoomEntry,
  closeWaitingRoomDay,
} from "../api/waitingRoom";
import { WaitingRoomEntry, WaitingRoomStatus } from "../types/waitingRoom";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import RegisterWalkinModal from "../components/RegisterWalkinModal";

// Badge visual para estado
const renderStatusBadge = (status: WaitingRoomStatus) => {
  return <span className={`badge ${status}`}>{status}</span>;
};

// Badge visual para prioridad
const renderPriorityBadge = (priority?: string) => {
  if (!priority) return null;
  return <span className={`badge priority-${priority}`}>{priority}</span>;
};

export default function WaitingRoom() {
  const [grupoA, setGrupoA] = useState<WaitingRoomEntry[]>([]);
  const [grupoB, setGrupoB] = useState<WaitingRoomEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    getWaitingRoomGroupsToday()
      .then((data) => {
        setGrupoA(data.grupo_a || []);
        setGrupoB(data.grupo_b || []);
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

  if (loading) return <p>Cargando sala de espera...</p>;
  if (error) return <p className="text-danger">Error: {error}</p>;

  return (
    <div>
      <div className="page-header">
        <h2>Sala de Espera</h2>
        <div className="actions">
          <button className="btn btn-success" onClick={() => setShowModal(true)}>
            Registrar llegada
          </button>
          <button className="btn btn-danger" onClick={handleCloseDay}>
            Cerrar jornada
          </button>
        </div>
      </div>

      <h3>Grupo A</h3>
      <table className="table mb-4">
        <thead>
          <tr>
            <th>Paciente</th>
            <th>Estado</th>
            <th>Tiempo de espera</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {grupoA.map((e) => (
            <tr key={e.id}>
              <td>{e.patient.full_name}</td>
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
                    className="btn btn-outline"
                    onClick={() => handleStatusChange(e.id, "in_consultation")}
                  >
                    Pasar a consulta
                  </button>
                )}
                {e.status === "in_consultation" && (
                  <button
                    className="btn btn-success"
                    onClick={() => handleStatusChange(e.id, "completed")}
                  >
                    Finalizar consulta
                  </button>
                )}
                {e.status === "completed" && (
                  <span className="text-success font-bold">Consulta finalizada</span>
                )}
                <button
                  className="btn btn-outline text-danger"
                  onClick={() => handleStatusChange(e.id, "canceled")}
                >
                  Cancelar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Grupo B</h3>
      <table className="table">
        <thead>
          <tr>
            <th>Paciente</th>
            <th>Estado</th>
            <th>Tiempo de espera</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {grupoB.map((e) => (
            <tr key={e.id}>
              <td>{e.patient.full_name}</td>
              <td>
                {renderStatusBadge(e.status)} {renderPriorityBadge(e.priority)}
              </td>
              <td>
                {e.arrival_time
                  ? formatDistanceToNow(new Date(e.arrival_time), { locale: es })
                  : "—"}
              </td>
              <td>
                {e.status === "in_consultation" && (
                  <button
                    className="btn btn-success"
                    onClick={() => handleStatusChange(e.id, "completed")}
                  >
                    Finalizar
                  </button>
                )}
                <button
                  className="btn btn-outline text-danger"
                  onClick={() => handleStatusChange(e.id, "canceled")}
                >
                  Cancelar
                </button>
                {e.priority !== "emergency" && (
                  <button
                    className="btn btn-warning"
                    onClick={() => handlePromoteToEmergency(e.id)}
                  >
                    Emergencia
                  </button>
                )}
                {(e.priority === "walkin" || e.status === "pending") && (
                  <button
                    className="btn btn-success"
                    onClick={() => handleConfirmWalkin(e.id)}
                  >
                    Confirmar
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <RegisterWalkinModal
          onClose={() => setShowModal(false)}
          onSuccess={(entry: WaitingRoomEntry) => {
            setGrupoB((prev) => [...prev, entry]);
          }}
        />
      )}
    </div>
  );
}
