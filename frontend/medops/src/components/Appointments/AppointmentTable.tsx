import React, { useMemo, useState } from "react";
import { Appointment, AppointmentStatus } from "../../types/appointments";

interface Props {
  appointments: Appointment[];
  onSelect: (appointment: Appointment) => void;
  onCreate: () => void;
  onCancel?: (appointmentId: number) => Promise<void> | void;
}

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  pending: "Pendiente",
  arrived: "Llegó",
  in_consultation: "En consulta",
  completed: "Completada",
  canceled: "Cancelada",
};

const STATUS_CLASS: Record<AppointmentStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 ring-yellow-200",
  arrived: "bg-green-100 text-green-800 ring-green-200",
  in_consultation: "bg-blue-100 text-blue-800 ring-blue-200",
  completed: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  canceled: "bg-red-100 text-red-800 ring-red-200",
};

export default function AppointmentTable({
  appointments,
  onSelect,
  onCreate,
  onCancel,
}: Props) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<AppointmentStatus | "all">("all");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  const filtered = useMemo(() => {
    return appointments
      .filter((a) => (status === "all" ? true : a.status === status))
      .filter((a) =>
        search.trim()
          ? a.patient.full_name.toLowerCase().includes(search.toLowerCase())
          : true
      )
      .filter((a) => (from ? a.appointment_date >= from : true))
      .filter((a) => (to ? a.appointment_date <= to : true))
      .sort((a, b) => a.appointment_date.localeCompare(b.appointment_date));
  }, [appointments, status, search, from, to]);

  return (
    <div className="page">
      {/* Header + acciones */}
      <div className="flex-between mb-16">
        <h2>Lista ejecutiva de citas</h2>
        <button onClick={onCreate} className="btn btn-primary">
          + Crear cita
        </button>
      </div>

      {/* Filtros */}
      <div className="grid-2col gap-16 mb-16">
        <div>
          <label className="label">Buscar paciente</label>
          <input
            type="text"
            placeholder="Nombre del paciente"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="label">Estado</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="select"
          >
            <option value="all">Todos</option>
            <option value="pending">Pendiente</option>
            <option value="arrived">Llegó</option>
            <option value="in_consultation">En consulta</option>
            <option value="completed">Completada</option>
            <option value="canceled">Cancelada</option>
          </select>
        </div>
        <div>
          <label className="label">Desde</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="label">Hasta</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="input"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Paciente</th>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th>Monto esperado</th>
              <th className="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-muted italic">
                  No hay citas con los filtros actuales.
                </td>
              </tr>
            )}

            {filtered.map((a) => (
              <tr key={a.id}>
                <td>
                  <div className="flex-between">
                    <span>{a.patient.full_name}</span>
                    <a href={`/patients/${a.patient.id}`} className="text-muted">
                      Ver ficha
                    </a>
                  </div>
                </td>
                <td>{formatDate(a.appointment_date)}</td>
                <td>{a.appointment_type === "general" ? "General" : "Especializada"}</td>
                <td>
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${STATUS_CLASS[a.status]}`}
                  >
                    {STATUS_LABEL[a.status]}
                  </span>
                </td>
                <td>{formatCurrency(a.expected_amount)}</td>
                <td className="text-right">
                  <div className="btn-row">
                    <button onClick={() => onSelect(a)} className="btn btn-outline">
                      Detalle
                    </button>
                    <button
                      disabled={a.status === "canceled" || a.status === "completed"}
                      onClick={() => onCancel?.(a.id)}
                      className={`btn ${
                        a.status === "canceled" || a.status === "completed"
                          ? "btn-outline text-muted"
                          : "btn btn-primary text-danger"
                      }`}
                    >
                      Cancelar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 🔹 Helpers
function formatDate(dateISO: string) {
  try {
    const d = new Date(dateISO);
    if (isNaN(d.getTime())) return dateISO;
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return dateISO;
  }
}

function formatCurrency(value: string | number | undefined) {
  if (value === undefined || value === null) return "—";
  const num = typeof value === "string" ? Number(value) : value;
  if (isNaN(num)) return String(value);
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(num);
}
