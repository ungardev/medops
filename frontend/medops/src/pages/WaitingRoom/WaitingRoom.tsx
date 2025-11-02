import { useState } from "react";
import RegisterWalkinModal from "../../components/WaitingRoom/RegisterWalkinModal";
import { useWaitingRoomEntriesToday } from "../../hooks/waitingroom/useWaitingRoomEntriesToday";
import { useUpdateWaitingRoomStatus } from "../../hooks/waitingroom/useUpdateWaitingRoomStatus";
import { useRegisterArrival } from "../../hooks/waitingroom/useRegisterArrival";
import { useUpdateAppointmentStatus } from "../../hooks/appointments/useUpdateAppointmentStatus";
import type { WaitingRoomStatus, WaitingRoomEntry } from "../../types/waitingRoom";
import { useQueryClient } from "@tanstack/react-query";
import PageHeader from "../../components/Layout/PageHeader";

// Badge visual para estado
const renderStatusBadge = (status: WaitingRoomStatus | string) => (
  <span className={`badge ${status}`}>{status}</span>
);

// Calcular tiempo de espera
const renderWaitTime = (arrival_time: string | null) => {
  if (!arrival_time) return "-";
  const minutes = Math.floor(
    (new Date().getTime() - new Date(arrival_time).getTime()) / 60000
  );
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `~${hours} h`;
};

// Botón de acción según estado
const renderActionButton = (
  entry: WaitingRoomEntry,
  onChange: (entry: WaitingRoomEntry, newStatus: WaitingRoomStatus) => void,
  entries: WaitingRoomEntry[]
) => {
  const effectiveStatus = entry.appointment_status ?? entry.status;
  const hasActiveConsultation = entries.some(
    (e) => (e.appointment_status ?? e.status) === "in_consultation"
  );

  switch (effectiveStatus) {
    case "waiting":
      return (
        <div className="actions-inline">
          <button
            className="btn-primary-compact"
            disabled={hasActiveConsultation}
            onClick={() => onChange(entry, "in_consultation")}
          >
            Iniciar consulta
          </button>
          <button
            className="btn-secondary-compact"
            onClick={() => onChange(entry, "canceled")}
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
            onClick={() => onChange(entry, "completed")}
          >
            Finalizar consulta
          </button>
          <button
            className="btn-secondary-compact"
            onClick={() => onChange(entry, "canceled")}
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
            onClick={() => onChange(entry, "waiting")}
          >
            Confirmar
          </button>
          <button
            className="btn-secondary-compact"
            onClick={() => onChange(entry, "canceled")}
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

  const { data: entries, isLoading, error } = useWaitingRoomEntriesToday();
  const updateWaitingRoomStatus = useUpdateWaitingRoomStatus();
  const updateAppointmentStatus = useUpdateAppointmentStatus();
  const registerArrival = useRegisterArrival();
  const queryClient = useQueryClient();

  const handleStatusChange = (entry: WaitingRoomEntry, newStatus: WaitingRoomStatus) => {
    if (["in_consultation", "completed", "canceled"].includes(newStatus)) {
      if (entry.appointment_id) {
        updateAppointmentStatus.mutate({ id: entry.appointment_id, status: newStatus });
      }
    } else {
      updateWaitingRoomStatus.mutate({ id: entry.id, status: newStatus });
    }
  };

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

  const orderedGroup: WaitingRoomEntry[] =
    entries?.filter((e) => {
      const effectiveStatus = e.appointment_status ?? e.status;
      return ["waiting", "in_consultation", "completed"].includes(effectiveStatus);
    }) ?? [];

  const pendingGroup: WaitingRoomEntry[] =
    entries?.filter((e) => {
      const effectiveStatus = e.appointment_status ?? e.status;
      return ["pending", "canceled"].includes(effectiveStatus);
    }) ?? [];

  return (
    <div className="page">
      <div className="page-header flex items-center justify-between">
        <PageHeader title="Sala de Espera" />
        <div className="actions flex gap-2">
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
          {orderedGroup.map((entry) => {
            const effectiveStatus = entry.appointment_status ?? entry.status;
            return (
              <tr key={entry.id}>
                <td>{entry.patient.full_name}</td>
                <td>{renderStatusBadge(effectiveStatus)}</td>
                <td>{renderWaitTime(entry.arrival_time)}</td>
                <td>{renderActionButton(entry, handleStatusChange, entries ?? [])}</td>
              </tr>
            );
          })}
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
          {pendingGroup.map((entry) => {
            const effectiveStatus = entry.appointment_status ?? entry.status;
            return (
              <tr key={entry.id}>
                <td>{entry.patient.full_name}</td>
                <td>{renderStatusBadge(effectiveStatus)}</td>
                <td>{renderWaitTime(entry.arrival_time)}</td>
                <td>{renderActionButton(entry, handleStatusChange, entries ?? [])}</td>
              </tr>
            );
          })}
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
