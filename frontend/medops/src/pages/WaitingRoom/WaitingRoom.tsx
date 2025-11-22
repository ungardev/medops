// src/pages/WaitingRoom.tsx
import { useState, useEffect } from "react";
import RegisterWalkinModal from "../../components/WaitingRoom/RegisterWalkinModal";
import ConfirmGenericModal from "../../components/Common/ConfirmGenericModal";
import Toast from "../../components/Common/Toast";

import { useWaitingRoomEntriesToday } from "../../hooks/waitingroom/useWaitingRoomEntriesToday";
import { useUpdateWaitingRoomStatus } from "../../hooks/waitingroom/useUpdateWaitingRoomStatus";
import { useRegisterArrival } from "../../hooks/waitingroom/useRegisterArrival";
import { useUpdateAppointmentStatus } from "../../hooks/appointments/useUpdateAppointmentStatus";
import type { WaitingRoomStatus, WaitingRoomEntry } from "../../types/waitingRoom";
import { useQueryClient } from "@tanstack/react-query";
import PageHeader from "../../components/Layout/PageHeader";

// 🔹 Badge visual para estado
const renderStatusBadge = (status: WaitingRoomStatus | string) => {
  const base = "px-2 py-0.5 text-xs rounded font-semibold";
  switch (status) {
    case "waiting":
      return <span className={`${base} bg-yellow-500 text-white`}>En espera</span>;
    case "in_consultation":
      return <span className={`${base} bg-blue-600 text-white`}>En consulta</span>;
    case "pending":
      return <span className={`${base} bg-gray-500 text-white`}>Pendiente</span>;
    case "completed":
      return <span className={`${base} bg-green-600 text-white`}>Completada</span>;
    case "canceled":
      return <span className={`${base} bg-red-600 text-white`}>Cancelada</span>;
    default:
      return <span className={`${base} bg-gray-400 text-white`}>{status}</span>;
  }
};

// 🔹 Calcular tiempo de espera
const renderWaitTime = (arrival_time: string | null) => {
  if (!arrival_time || isNaN(new Date(arrival_time).getTime())) return "-";
  const minutes = Math.floor(
    (new Date().getTime() - new Date(arrival_time).getTime()) / 60000
  );
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `~${hours} h`;
};

// 🔹 Botón de acción según estado
const renderActionButton = (
  entry: WaitingRoomEntry,
  onChange: (entry: WaitingRoomEntry, newStatus: WaitingRoomStatus) => void,
  entries: WaitingRoomEntry[]
) => {
  const effectiveStatus = entry.appointment_status ?? entry.status ?? "waiting";
  const hasActiveConsultation = entries.some(
    (e) => (e.appointment_status ?? e.status ?? "waiting") === "in_consultation"
  );

  const baseBtn =
    "px-3 py-1.5 text-xs rounded font-medium transition-colors border";

  switch (effectiveStatus) {
    case "waiting":
      return (
        <div className="flex gap-2">
          <button
            className={`${baseBtn} bg-blue-600 text-white border-blue-600 hover:bg-blue-700`}
            disabled={hasActiveConsultation}
            onClick={() => onChange(entry, "in_consultation")}
          >
            Iniciar consulta
          </button>
          <button
            className={`${baseBtn} bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200`}
            onClick={() => onChange(entry, "canceled")}
          >
            Cancelar
          </button>
        </div>
      );
    case "in_consultation":
      return (
        <div className="flex gap-2">
          <button
            className={`${baseBtn} bg-green-600 text-white border-green-600 hover:bg-green-700`}
            onClick={() => onChange(entry, "completed")}
          >
            Finalizar consulta
          </button>
          <button
            className={`${baseBtn} bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200`}
            onClick={() => onChange(entry, "canceled")}
          >
            Cancelar
          </button>
        </div>
      );
    case "pending":
      return (
        <div className="flex gap-2">
          <button
            className={`${baseBtn} bg-blue-600 text-white border-blue-600 hover:bg-blue-700`}
            onClick={() => onChange(entry, "waiting")}
          >
            Confirmar
          </button>
          <button
            className={`${baseBtn} bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200`}
            onClick={() => onChange(entry, "canceled")}
          >
            Cancelar
          </button>
        </div>
      );
    case "completed":
      return <span className="text-green-600 font-semibold">Consulta finalizada</span>;
    case "canceled":
      return <span className="text-red-600 font-semibold">Cancelado</span>;
    default:
      return null;
  }
};
export default function WaitingRoom() {
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const { data: entries, isLoading, error } = useWaitingRoomEntriesToday();
  const updateWaitingRoomStatus = useUpdateWaitingRoomStatus();
  const updateAppointmentStatus = useUpdateAppointmentStatus();
  const registerArrival = useRegisterArrival();
  const queryClient = useQueryClient();

  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["waitingRoomEntriesToday"] });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = (entry: WaitingRoomEntry, newStatus: WaitingRoomStatus) => {
    if (["in_consultation", "completed", "canceled"].includes(newStatus)) {
      if (entry.appointment_id) {
        updateAppointmentStatus.mutate({ id: entry.appointment_id, status: newStatus });
      }
    } else {
      if (typeof entry.id === "number") {
        updateWaitingRoomStatus.mutate({ id: entry.id, status: newStatus });
      }
    }
  };

  const handleRegisterArrival = async (patientId: number) => {
    const tempId = `temp-${Date.now()}`;
    const newEntry: WaitingRoomEntry = {
      id: tempId,
      patient: { id: patientId, full_name: "Cargando..." },
      appointment_id: null,
      appointment_status: "pending",
      status: "pending",
      arrival_time: new Date().toISOString(),
      priority: "normal",
      source_type: "walkin",
      order: 99,
    };

    queryClient.setQueryData(["waitingRoomEntriesToday"], (old: WaitingRoomEntry[] = []) => [
      ...old,
      newEntry,
    ]);

    const result = await registerArrival.mutateAsync({ patient_id: patientId });
    queryClient.setQueryData(["waitingRoomEntriesToday"], (old: WaitingRoomEntry[] = []) =>
      old.map((entry) => (entry.id === tempId ? result : entry))
    );

    setShowModal(false);
    setToast({ message: "✅ Paciente registrado en sala de espera", type: "success" });
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
      setToast({ message: "✅ Jornada cerrada correctamente", type: "success" });
    } catch (err: any) {
      setToast({ message: err.message, type: "error" });
    } finally {
      setShowConfirm(false);
    }
  };

  if (isLoading) return <p className="text-gray-500">Cargando sala de espera...</p>;
  if (error) return <p className="text-red-600">Error cargando datos</p>;

  const orderedGroup: WaitingRoomEntry[] =
    entries?.filter((e) => {
      const status = e.appointment_status ?? e.status ?? "waiting";
      return ["waiting", "in_consultation", "completed"].includes(status);
    }) ?? [];

  const pendingGroup: WaitingRoomEntry[] =
    entries?.filter((e) => {
      const status = e.appointment_status ?? e.status ?? "waiting";
      return ["pending", "canceled"].includes(status);
    }) ?? [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <PageHeader title="Sala de Espera" />
        <div className="flex gap-2">
          <button
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            onClick={() => setShowModal(true)}
          >
            Registrar llegada
          </button>
          <button
            className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 transition-colors"
            onClick={() => setShowConfirm(true)}
          >
            Cerrar jornada
          </button>
        </div>
      </div>

      {/* Lista Orden */}
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Lista Orden</h3>
      <table className="min-w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg mb-4">
        <thead className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
          <tr>
            <th className="px-4 py-2 border-b">Paciente</th>
            <th className="px-4 py-2 border-b">Estado</th>
            <th className="px-4 py-2 border-b">Tiempo de espera</th>
            <th className="px-4 py-2 border-b">Acción</th>
          </tr>
        </thead>
        <tbody>
          {orderedGroup.map((entry) => {
            const status = entry.appointment_status ?? entry.status ?? "waiting";
            return (
              <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-4 py-2 border-b">{entry.patient?.full_name ?? "SIN-NOMBRE"}</td>
                <td className="px-4 py-2 border-b">{renderStatusBadge(status)}</td>
                <td className="px-4 py-2 border-b">{renderWaitTime(entry.arrival_time)}</td>
                <td className="px-4 py-2 border-b">
                  {renderActionButton(entry, handleStatusChange, entries ?? [])}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Por Confirmar */}
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Por Confirmar</h3>
      <table className="min-w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg">
        <thead className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
          <tr>
            <th className="px-4 py-2 border-b">Paciente</th>
            <th className="px-4 py-2 border-b">Estado</th>
            <th className="px-4 py-2 border-b">Tiempo de espera</th>
            <th className="px-4 py-2 border-b">Acción</th>
          </tr>
        </thead>
        <tbody>
          {pendingGroup.map((entry) => {
            const status = entry.appointment_status ?? entry.status ?? "waiting";
            return (
              <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-4 py-2 border-b">{entry.patient?.full_name ?? "SIN-NOMBRE"}</td>
                <td className="px-4 py-2 border-b">{renderStatusBadge(status)}</td>
                <td className="px-4 py-2 border-b">{renderWaitTime(entry.arrival_time)}</td>
                <td className="px-4 py-2 border-b">
                  {renderActionButton(entry, handleStatusChange, entries ?? [])}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Modales */}
      {showModal && (
        <RegisterWalkinModal
          onClose={() => setShowModal(false)}
          onSuccess={(patientId) => handleRegisterArrival(patientId)}
          existingEntries={entries ?? []}
        />
      )}

      {showConfirm && (
        <ConfirmGenericModal
          title="Confirmar cierre de jornada"
          message="¿Desea cerrar la jornada de hoy? Esta acción cancelará a todos los pacientes pendientes."
          confirmLabel="Sí, cerrar"
          cancelLabel="No"
          onConfirm={handleCloseDay}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
