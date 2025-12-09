// src/pages/WaitingRoom/WaitingRoom.tsx
import { useState } from "react";
import RegisterWalkinModal from "../../components/WaitingRoom/RegisterWalkinModal";
import ConfirmGenericModal from "../../components/Common/ConfirmGenericModal";
import Toast from "../../components/Common/Toast";
import LoadingOverlay from "../../components/Common/LoadingOverlay";

import { useWaitingRoomEntriesToday } from "../../hooks/waitingroom/useWaitingRoomEntriesToday";
import { useUpdateWaitingRoomStatus } from "../../hooks/waitingroom/useUpdateWaitingRoomStatus";
import { useRegisterArrival } from "../../hooks/waitingroom/useRegisterArrival";
import { useUpdateAppointmentStatus } from "../../hooks/appointments/useUpdateAppointmentStatus";
import type { WaitingRoomStatus, WaitingRoomEntry } from "../../types/waitingRoom";
import { useQueryClient } from "@tanstack/react-query";
import PageHeader from "../../components/Layout/PageHeader";

/**
 * Badges de estado — institucional
 */
const renderStatusBadge = (status: WaitingRoomStatus | string) => {
  const base =
    "inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] sm:text-xs rounded font-semibold whitespace-nowrap max-w-[96px] truncate";
  switch (status) {
    case "waiting": return <span className={`${base} bg-yellow-500 text-white`}>En espera</span>;
    case "in_consultation": return <span className={`${base} bg-[#0d2c53] text-white`}>En consulta</span>;
    case "pending": return <span className={`${base} bg-gray-500 text-white`}>Pendiente</span>;
    case "completed": return <span className={`${base} bg-green-600 text-white`}>Completada</span>;
    case "canceled": return <span className={`${base} bg-red-600 text-white`}>Cancelada</span>;
    default: return <span className={`${base} bg-gray-400 text-white`}>{status}</span>;
  }
};

/**
 * Tiempo de espera
 */
const renderWaitTime = (arrival_time: string | null) => {
  if (!arrival_time || isNaN(new Date(arrival_time).getTime())) return "-";
  const minutes = Math.floor((Date.now() - new Date(arrival_time).getTime()) / 60000);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `~${hours} h`;
};
/**
 * Botones de acción por estado
 */
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
    "px-2 sm:px-3 py-1 text-[11px] sm:text-xs rounded font-medium transition-colors border whitespace-nowrap";

  switch (effectiveStatus) {
    case "waiting":
      return (
        <div className="flex gap-2 flex-wrap md:flex-nowrap">
          <button
            className={`${baseBtn} bg-[#0d2c53] text-white border-[#0d2c53] hover:bg-[#0b2444]`}
            disabled={hasActiveConsultation}
            onClick={() => onChange(entry, "in_consultation")}
          >
            <span className="hidden sm:inline">Iniciar consulta</span>
            <span className="sm:hidden inline">Iniciar</span>
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
        <div className="flex gap-2 flex-wrap md:flex-nowrap">
          <button
            className={`${baseBtn} bg-green-600 text-white border-green-600 hover:bg-green-700`}
            onClick={() => onChange(entry, "completed")}
          >
            Finalizar
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
        <div className="flex gap-2 flex-wrap md:flex-nowrap">
          <button
            className={`${baseBtn} bg-[#0d2c53] text-white border-[#0d2c53] hover:bg-[#0b2444]`}
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
      return <span className="text-green-600 font-semibold text-xs sm:text-sm">Consulta finalizada</span>;
    case "canceled":
      return <span className="text-red-600 font-semibold text-xs sm:text-sm">Cancelado</span>;
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

    const handleStatusChange = (entry: WaitingRoomEntry, newStatus: WaitingRoomStatus) => {
    if (["in_consultation", "completed", "canceled"].includes(newStatus)) {
      if (entry.appointment_id) updateAppointmentStatus.mutate({ id: entry.appointment_id, status: newStatus });
    } else {
      if (typeof entry.id === "number") updateWaitingRoomStatus.mutate({ id: entry.id, status: newStatus });
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
    queryClient.setQueryData(["waitingRoomEntriesToday"], (old: WaitingRoomEntry[] = []) => [...old, newEntry]);
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
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Token ${token}` } : {}) },
      });
      if (!res.ok) throw new Error("Error al cerrar la jornada");
      setToast({ message: "✅ Jornada cerrada correctamente", type: "success" });
    } catch (err: any) {
      setToast({ message: err.message, type: "error" });
    } finally {
      setShowConfirm(false);
    }
  };

  // ⚔️ Skeleton institucional en primera carga
  if (isLoading && (!entries || entries.length === 0)) {
    return (
      <div className="p-4 sm:p-6">
        <PageHeader title="Sala de Espera" />
        <table className="min-w-full text-xs sm:text-sm border border-gray-200 rounded-lg">
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="animate-pulse">
                <td className="px-4 py-2 border-b bg-gray-100">&nbsp;</td>
                <td className="px-4 py-2 border-b bg-gray-100">&nbsp;</td>
                <td className="px-4 py-2 border-b bg-gray-100">&nbsp;</td>
                <td className="px-4 py-2 border-b bg-gray-100">&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

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
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <PageHeader title="Sala de Espera" />
        <div className="flex gap-2">
          <button
            className="px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-md bg-[#0d2c53] text-white border border-[#0d2c53] hover:bg-[#0b2444] transition-colors"
            onClick={() => setShowModal(true)}
            aria-label="Registrar llegada"
          >
            Registrar llegada
          </button>
          <button
            className="px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-md bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 transition-colors"
            onClick={() => setShowConfirm(true)}
            aria-label="Cerrar jornada"
          >
            Cerrar jornada
          </button>
        </div>
      </div>

      {/* Lista Orden */}
      <h3 className="text-sm sm:text-lg font-semibold text-[#0d2c53] dark:text-white">Lista Orden</h3>
      <table className="min-w-full text-xs sm:text-sm border border-gray-200 dark:border-gray-700 rounded-lg mb-4">
        <thead className="bg-gray-50 dark:bg-gray-700 text-[#0d2c53] dark:text-gray-200">
          <tr>
            <th className="px-2 sm:px-4 py-2 border-b text-left">Paciente</th>
            <th className="px-2 sm:px-4 py-2 border-b text-left">Estado</th>
            <th className="px-2 sm:px-4 py-2 border-b text-left">Tiempo</th>
            <th className="px-2 sm:px-4 py-2 border-b text-left">Acción</th>
          </tr>
        </thead>
        <tbody>
          {orderedGroup.map((entry) => {
            const status = entry.appointment_status ?? entry.status ?? "waiting";
            return (
              <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-2 sm:px-4 py-2 border-b truncate max-w-[220px]">
                  {entry.patient?.full_name ?? "SIN-NOMBRE"}
                </td>
                <td className="px-2 sm:px-4 py-2 border-b">{renderStatusBadge(status)}</td>
                <td className="px-2 sm:px-4 py-2 border-b">{renderWaitTime(entry.arrival_time)}</td>
                <td className="px-2 sm:px-4 py-2 border-b">
                  {renderActionButton(entry, handleStatusChange, entries ?? [])}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Por Confirmar */}
      <h3 className="text-sm sm:text-lg font-semibold text-[#0d2c53] dark:text-white">Por Confirmar</h3>
      <table className="min-w-full text-xs sm:text-sm border border-gray-200 dark:border-gray-700 rounded-lg">
        <thead className="bg-gray-50 dark:bg-gray-700 text-[#0d2c53] dark:text-gray-200">
          <tr>
            <th className="px-2 sm:px-4 py-2 border-b text-left">Paciente</th>
            <th className="px-2 sm:px-4 py-2 border-b text-left">Estado</th>
            <th className="px-2 sm:px-4 py-2 border-b text-left">Tiempo</th>
            <th className="px-2 sm:px-4 py-2 border-b text-left">Acción</th>
          </tr>
        </thead>
        <tbody>
          {pendingGroup.map((entry) => {
            const status = entry.appointment_status ?? entry.status ?? "waiting";
            return (
              <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-2 sm:px-4 py-2 border-b truncate max-w-[220px]">
                  {entry.patient?.full_name ?? "SIN-NOMBRE"}
                </td>
                <td className="px-2 sm:px-4 py-2 border-b">{renderStatusBadge(status)}</td>
                <td className="px-2 sm:px-4 py-2 border-b">{renderWaitTime(entry.arrival_time)}</td>
                <td className="px-2 sm:px-4 py-2 border-b">
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
