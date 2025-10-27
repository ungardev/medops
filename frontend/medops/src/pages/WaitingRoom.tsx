import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import RegisterWalkinModal from "../components/RegisterWalkinModal";
import { useWaitingroomGroupsToday } from "../hooks/useWaitingroomGroupsToday";
import { useUpdateWaitingRoomStatus } from "../hooks/useUpdateWaitingRoomStatus";
import { useRegisterArrival } from "../hooks/useRegisterArrival";
import type { WaitingRoomStatus } from "../types/waitingRoom";

// Badge visual para estado
const renderStatusBadge = (status: WaitingRoomStatus) => (
  <span className={`badge ${status}`}>{status}</span>
);

// Badge visual para prioridad
const renderPriorityBadge = (priority?: string) =>
  priority ? <span className={`badge priority-${priority}`}>{priority}</span> : null;

export default function WaitingRoom() {
  const [showModal, setShowModal] = useState(false);
  const [now, setNow] = useState(new Date());

  // Hooks de React Query
  const { data: groups, isLoading, error } = useWaitingroomGroupsToday();
  const updateStatus = useUpdateWaitingRoomStatus();
  const registerArrival = useRegisterArrival();

  // Actualizar reloj cada minuto
  useState(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  });

  const formattedNow = format(now, "EEEE, d 'de' MMMM 'de' yyyy – HH:mm", { locale: es });

  // Handlers
  const handleStatusChange = (id: number, newStatus: WaitingRoomStatus) => {
    updateStatus.mutate({ id, status: newStatus });
  };

  const handleRegisterArrival = async (patientId: number) => {
    await registerArrival.mutateAsync({ patient_id: patientId });
    setShowModal(false);
  };

  if (isLoading) return <p>Cargando sala de espera...</p>;
  if (error) return <p className="text-danger">Error cargando datos</p>;

  // Derivar grupos desde la API (con protección contra undefined)
  const grupoA =
    groups?.by_status?.filter(
      (g) => g.status === "waiting" || g.status === "in_consultation"
    ) ?? [];

  const grupoB =
    groups?.by_status?.filter(
      (g) => g.status === "pending" || g.status === "canceled"
    ) ?? [];

  const grupoPrioridades = groups?.by_priority ?? [];

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
        </div>
      </div>

      <h3>Lista Orden (por estado)</h3>
      <table className="table mb-4">
        <thead>
          <tr>
            <th>Estado</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {grupoA.map((g) => (
            <tr key={g.status}>
              <td>{renderStatusBadge(g.status as WaitingRoomStatus)}</td>
              <td>{g.total}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Por Confirmar (por estado)</h3>
      <table className="table">
        <thead>
          <tr>
            <th>Estado</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {grupoB.map((g) => (
            <tr key={g.status}>
              <td>{renderStatusBadge(g.status as WaitingRoomStatus)}</td>
              <td>{g.total}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Por Prioridad</h3>
      <table className="table">
        <thead>
          <tr>
            <th>Prioridad</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {grupoPrioridades.map((g) => (
            <tr key={g.priority}>
              <td>{renderPriorityBadge(g.priority)}</td>
              <td>{g.total}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <RegisterWalkinModal
          onClose={() => setShowModal(false)}
          onSuccess={(entry) => handleRegisterArrival(entry.patient.id)}
        />
      )}
    </div>
  );
}
