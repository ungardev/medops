import { useState, useEffect } from "react";
import RegisterWalkinModal from "../../components/WaitingRoom/RegisterWalkinModal";
import ConfirmGenericModal from "../../components/Common/ConfirmGenericModal";
import Toast from "../../components/Common/Toast";
import PageHeader from "../../components/Layout/PageHeader";

import { useWaitingRoomEntriesToday } from "../../hooks/waitingroom/useWaitingRoomEntriesToday";
import { useUpdateWaitingRoomStatus } from "../../hooks/waitingroom/useUpdateWaitingRoomStatus";
import { useRegisterArrival } from "../../hooks/waitingroom/useRegisterArrival";
import { useUpdateAppointmentStatus } from "../../hooks/appointments/useUpdateAppointmentStatus";

import type { WaitingRoomEntry, WaitingRoomStatus } from "../../types/waitingRoom";
import type { Appointment } from "../../types/appointments";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PlayIcon, XMarkIcon } from "@heroicons/react/24/solid";

const renderStatusBadge = (status: string) => {
  const base =
    "inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] sm:text-xs rounded font-semibold whitespace-nowrap max-w-[96px] truncate";

  switch (status) {
    case "waiting":
      return <span className={`${base} bg-yellow-500 text-white`}>En espera</span>;
    case "arrived":
      return <span className={`${base} bg-yellow-600 text-white`}>Llegó</span>;
    case "in_consultation":
      return <span className={`${base} bg-[#0d2c53] text-white`}>En consulta</span>;
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

const renderWaitTime = (arrival_time: string | null) => {
  if (!arrival_time) return "-";
  const minutes = Math.floor((Date.now() - new Date(arrival_time).getTime()) / 60000);
  if (minutes < 60) return `${minutes} min`;
  return `~${Math.floor(minutes / 60)} h`;
};

const renderActionButton = (
  entry: WaitingRoomEntry,
  onChange: (entry: WaitingRoomEntry, newStatus: WaitingRoomStatus) => void,
  entries: WaitingRoomEntry[],
  setEntryToCancel: (e: WaitingRoomEntry | null) => void
) => {
  const effectiveStatus = entry.appointment_status ?? entry.status;
  const hasActiveConsultation = entries.some(
    (e) => (e.appointment_status ?? e.status) === "in_consultation"
  );

  const iconBase =
    "w-5 h-5 sm:w-6 sm:h-6 text-[#0d2c53] dark:text-white cursor-pointer hover:scale-110 transition-transform";

  switch (effectiveStatus) {
    case "waiting":
      return (
        <div className="flex gap-2 items-center">
          <PlayIcon
            className={iconBase}
            onClick={() => !hasActiveConsultation && onChange(entry, "in_consultation")}
            title="Iniciar consulta"
          />
          <XMarkIcon
            className={iconBase}
            onClick={() => setEntryToCancel(entry)}
            title="Cancelar"
          />
        </div>
      );

    case "in_consultation":
      return (
        <div className="flex gap-2 items-center">
          <PlayIcon
            className={`${iconBase} rotate-90`}
            onClick={() => onChange(entry, "completed")}
            title="Finalizar consulta"
          />
          <XMarkIcon
            className={iconBase}
            onClick={() => setEntryToCancel(entry)}
            title="Cancelar"
          />
        </div>
      );

    default:
      return null;
  }
};

export default function WaitingRoom() {
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [entryToCancel, setEntryToCancel] = useState<WaitingRoomEntry | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(
    null
  );

  const { data: entries, isLoading, isFetching } = useWaitingRoomEntriesToday();
  const updateWaitingRoomStatus = useUpdateWaitingRoomStatus();
  const updateAppointmentStatus = useUpdateAppointmentStatus();
  const registerArrival = useRegisterArrival();
  const queryClient = useQueryClient();

  const today = new Date().toISOString().split("T")[0];

  const { data: appointmentsToday } = useQuery({
    queryKey: ["appointmentsToday", today],
    queryFn: async (): Promise<Appointment[]> => {
      const res = await fetch(`/api/appointments/?date=${today}&status__in=pending,canceled`);
      if (res.status === 204) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 30000,
    refetchInterval: 10000,
    initialData: [],
  });

  const orderedGroup = (entries ?? []).filter((e) =>
    ["waiting", "in_consultation", "completed"].includes(e.status)
  );

  const pendingAppointmentsToday = (appointmentsToday ?? []).filter((a) =>
    ["pending", "canceled"].includes(a.status)
  );

  const [showOverlay, setShowOverlay] = useState(true);
  const isLoadingOverlay = isLoading || isFetching || showOverlay;

  useEffect(() => {
    const hasData = orderedGroup.length > 0 || pendingAppointmentsToday.length > 0;
    const isDone = !isLoading && !isFetching;

    if (isDone) {
      const timeout = setTimeout(() => setShowOverlay(false), hasData ? 500 : 0);
      return () => clearTimeout(timeout);
    }
  }, [isLoading, isFetching, orderedGroup.length, pendingAppointmentsToday.length]);

    const handleStatusChange = (entry: WaitingRoomEntry, newStatus: WaitingRoomStatus) => {
    if (entry.appointment_id) {
      updateAppointmentStatus.mutate({ id: entry.appointment_id, status: newStatus });
    } else {
      updateWaitingRoomStatus.mutate({ id: Number(entry.id), status: newStatus });
    }
  };

  const handleRegisterArrival = async (patientId: number) => {
    const tempId = `temp-${Date.now()}`;

    const newEntry: WaitingRoomEntry = {
      id: tempId,
      patient: { id: patientId, full_name: "Paciente" },
      appointment_id: null,
      appointment_status: "waiting",
      status: "waiting",
      arrival_time: new Date().toISOString(),
      priority: "normal",
      source_type: "walkin",
      order: (entries?.length ?? 0) + 1,
    };

    // ✅ Optimistic update institucional
    queryClient.setQueryData(["waitingRoomEntriesToday"], (old: WaitingRoomEntry[] | undefined) =>
      old ? [...old, newEntry] : [newEntry]
    );

    try {
      await registerArrival.mutateAsync({ patient_id: patientId });
      setToast({ message: "Paciente registrado en sala de espera", type: "success" });
    } catch {
      setToast({ message: "Error registrando llegada", type: "error" });
      queryClient.invalidateQueries({ queryKey: ["waitingRoomEntriesToday"] });
    }
  };

  return (
    <div className="p-4 sm:p-6 relative">
      <PageHeader title="Sala de Espera" subtitle="Gestión de pacientes y citas" />

      <div className="flex justify-between items-center mb-4">
        <button
          className="px-3 py-1 bg-[#0d2c53] text-white rounded"
          onClick={() => setShowModal(true)}
        >
          Registrar llegada
        </button>

        <button
          className="px-3 py-1 bg-gray-100 text-gray-700 border border-gray-300 rounded"
          onClick={() => setShowConfirm(true)}
        >
          Cerrar jornada
        </button>
      </div>

      {/* ✅ Overlay institucional anti‑lag */}
      {isLoadingOverlay && (
        <div className="absolute inset-0 bg-white/70 dark:bg-gray-900/70 flex items-center justify-center z-50">
          <span className="text-gray-600 dark:text-gray-300 text-sm">
            Actualizando sala de espera...
          </span>
        </div>
      )}

      {/* ✅ Lista Orden */}
      <h2 className="text-lg font-semibold mb-2">Lista Orden</h2>

      {isLoadingOverlay ? null : orderedGroup.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-300">No hay pacientes en sala de espera.</p>
      ) : (
        <div className="space-y-2">
          {orderedGroup.map((entry) => (
            <div key={entry.id} className="flex justify-between items-center border p-2 rounded">
              <div>
                <p className="font-medium">{entry.patient.full_name}</p>
                <p className="text-xs text-gray-500">
                  Tiempo: {renderWaitTime(entry.arrival_time)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {renderStatusBadge(entry.status)}
                {renderActionButton(entry, handleStatusChange, orderedGroup, setEntryToCancel)}
              </div>
            </div>
          ))}
        </div>
      )}
            {/* ✅ Por Confirmar */}
      <h2 className="text-lg font-semibold mt-6 mb-2">Por Confirmar</h2>

      {isLoadingOverlay ? null : pendingAppointmentsToday.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-300">
          No hay citas pendientes o canceladas para confirmar hoy.
        </p>
      ) : (
        <div className="space-y-2">
          {pendingAppointmentsToday.map((appt) => (
            <div key={appt.id} className="flex justify-between items-center border p-2 rounded">
              <div>
                <p className="font-medium">{appt.patient.full_name}</p>
                <p className="text-xs text-gray-500">Estado: {appt.status}</p>
              </div>

              <div className="flex items-center gap-2">
                {renderStatusBadge(appt.status)}

                <PlayIcon
                  className="w-5 h-5 sm:w-6 sm:h-6 text-[#0d2c53] dark:text-white cursor-pointer hover:scale-110 transition-transform"
                  onClick={() =>
                    updateAppointmentStatus.mutate({ id: appt.id, status: "waiting" })
                  }
                  title="Confirmar cita"
                />

                <XMarkIcon
                  className="w-5 h-5 sm:w-6 sm:h-6 text-[#0d2c53] dark:text-white cursor-pointer hover:scale-110 transition-transform"
                  onClick={() =>
                    updateAppointmentStatus.mutate({ id: appt.id, status: "canceled" })
                  }
                  title="Cancelar cita"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ✅ Modal Registrar Llegada */}
      {showModal && (
        <RegisterWalkinModal
          onClose={() => setShowModal(false)}
          onSuccess={(patientId: number) => handleRegisterArrival(patientId)}
          existingEntries={entries ?? []}
        />
      )}

      {/* ✅ Modal Confirmar Cancelación (acciones sensibles) */}
      {entryToCancel && (
        <ConfirmGenericModal
          title="Confirmar cancelación"
          message={`¿Está seguro de cancelar a ${entryToCancel.patient.full_name}?`}
          onConfirm={() => {
            handleStatusChange(entryToCancel, "canceled");
            setEntryToCancel(null);
          }}
          onCancel={() => setEntryToCancel(null)}
        />
      )}

      {/* ✅ Modal Cerrar Jornada */}
      {showConfirm && (
        <ConfirmGenericModal
          title="Cerrar jornada"
          message="¿Está seguro de cerrar la jornada de hoy?"
          onConfirm={() => {
            queryClient.invalidateQueries({ queryKey: ["waitingRoomEntriesToday"] });
            setShowConfirm(false);
            setToast({ message: "Jornada cerrada correctamente", type: "success" });
          }}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      {/* ✅ Toast institucional */}
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
