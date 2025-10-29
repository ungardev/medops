// src/pages/WaitingRoom.tsx
import { useState, useEffect } from "react";
import { format, differenceInMinutes } from "date-fns";
import { es } from "date-fns/locale";
import RegisterWalkinModal from "../../components/WaitingRoom/RegisterWalkinModal";
import { useWaitingRoomEntriesToday } from "../../hooks/waitingroom/useWaitingRoomEntriesToday";
import { useUpdateWaitingRoomStatus } from "../../hooks/waitingroom/useUpdateWaitingRoomStatus";
import { useRegisterArrival } from "../../hooks/waitingroom/useRegisterArrival";
import type { WaitingRoomStatus, WaitingRoomEntry } from "../../types/waitingRoom";
import { useQueryClient } from "@tanstack/react-query";

// Badge visual para estado
const renderStatusBadge = (status: WaitingRoomStatus) => (
  <span className={`badge ${status}`}>{status}</span>
);

// Calcular tiempo de espera
const renderWaitTime = (arrival_time: string | null) => {
  if (!arrival_time) return "-";
  const minutes = differenceInMinutes(new Date(), new Date(arrival_time));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `~${hours} h`;
};

// Botón de acción según estado
const renderActionButton = (
  entry: WaitingRoomEntry,
  onChange: (id: number, newStatus: WaitingRoomStatus) => void,
  entries: WaitingRoomEntry[]
) => {
  const hasActiveConsultation = entries.some(
    (e) => e.status === "in_consultation"
  );

  switch (entry.status) {
    case "waiting":
      return (
        <div className="actions-inline">
          <button
            className="btn-primary-compact"
            disabled={hasActiveConsultation}
            onClick={() => onChange(entry.id, "in_consultation")}
          >
            Iniciar consulta
          </button>
          <button
            className="btn-secondary-compact"
            onClick={() => onChange(entry.id, "canceled")}
          >
            Cancelar
          </button>
        </div>
      );
    case "in_consultation":
      return (
        <div className="actions-inline">
          <button
            className="btn-primary-compact"
            onClick={() => onChange(entry.id, "completed")}
          >
            Finalizar consulta
          </button>
          <button
            className="btn-secondary-compact"
            onClick={() => onChange(entry.id, "canceled")}
          >
            Cancelar
          </button>
        </div>
      );
    case "pending":
      return (
        <div className="actions-inline">
          <button
            className="btn-primary-compact"
            onClick={() => onChange(entry.id, "waiting")}
          >
            Confirmar
          </button>
          <button
            className="btn-secondary-compact"
            onClick={() => onChange(entry.id, "canceled")}
          >
            Cancelar
          </button>
        </div>
      );
    case "completed":
      return <span className="text-success">Consulta finalizada</span>;
    case "canceled":
      return <span className="text-danger">Cancelado</span>;
    default:
      return null;
  }
};

export default function WaitingRoom() {
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [now, setNow] = useState(new Date());

  // Hooks de React Query
  const { data: entries, isLoading, error } = useWaitingRoomEntriesToday();
  const updateStatus = useUpdateWaitingRoomStatus();
  const registerArrival = useRegisterArrival();
  const queryClient = useQueryClient();

  // Actualizar reloj cada minuto
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const formattedNow = format(now, "EEEE, d 'de' MMMM 'de' yyyy – HH:mm", {
    locale: es,
  });

  // Handler para cambiar estado
  const handleStatusChange = (id: number, newStatus: WaitingRoomStatus) => {
    updateStatus.mutate({ id, status: newStatus });
  };

  // 🔹 Ahora invalida la query después de registrar llegada
  const handleRegisterArrival = async (patientId: number) => {
    await registerArrival.mutateAsync({ patient_id: patientId });
    queryClient.invalidateQueries({ queryKey: ["waitingRoomEntriesToday"] });
    setShowModal(false);
  };

  const handleCloseDay = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch("http://127.0.0.1/api/waitingroom/close-day/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Token ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error("Error al cerrar la jornada");
      alert("✅ Jornada cerrada correctamente");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setShowConfirm(false);
    }
  };

  if (isLoading) return <p>Cargando sala de espera...</p>;
  if (error) return <p className="text-danger">Error cargando datos</p>;

  // Dividir entradas en dos grupos
  const grupoOrden: WaitingRoomEntry[] =
    entries?.filter(
      (e: WaitingRoomEntry) =>
        e.status === "waiting" ||
        e.status === "in_consultation" ||
        e.status === "completed"
    ) ?? [];

  const grupoPorConfirmar: WaitingRoomEntry[] =
    entries?.filter(
      (e: WaitingRoomEntry) => e.status === "pending" || e.status === "canceled"
    ) ?? [];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Sala de Espera</h2>
          <p className="text-muted">{formattedNow}</p>
        </div>
        <div className="actions">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            Registrar llegada
          </button>
          <button className="btn btn-special" onClick={() => setShowConfirm(true)}>
            Cerrar jornada
          </button>
        </div>
      </div>

      <h3>Lista Orden</h3>
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
          {grupoOrden.map((entry: WaitingRoomEntry) => (
            <tr key={entry.id}>
              <td>{entry.patient.full_name}</td>
              <td>{renderStatusBadge(entry.status)}</td>
              <td>{renderWaitTime(entry.arrival_time)}</td>
              <td>{renderActionButton(entry, handleStatusChange, entries ?? [])}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Por Confirmar</h3>
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
          {grupoPorConfirmar.map((entry: WaitingRoomEntry) => (
            <tr key={entry.id}>
              <td>{entry.patient.full_name}</td>
              <td>{renderStatusBadge(entry.status)}</td>
              <td>{renderWaitTime(entry.arrival_time)}</td>
              <td>{renderActionButton(entry, handleStatusChange, entries ?? [])}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <RegisterWalkinModal
          onClose={() => setShowModal(false)}
          onSuccess={(patientId) => handleRegisterArrival(patientId)}
          existingEntries={entries ?? []}
        />
      )}

      {showConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirmar cierre de jornada</h3>
            <p>
              ¿Desea cerrar la jornada de hoy? Esta acción cancelará a todos los
              pacientes pendientes.
            </p>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={handleCloseDay}>
                Sí, cerrar
              </button>
              <button
                className="btn btn-outline"
                onClick={() => setShowConfirm(false)}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
