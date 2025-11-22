// src/components/Appointments/AppointmentTable.tsx
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
    <div className="p-6 space-y-6">
      {/* Header + acciones */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
          Lista ejecutiva de citas
        </h2>
        <button
          onClick={onCreate}
          className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition text-sm"
        >
          + Crear cita
        </button>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Buscar paciente
          </label>
          <input
            type="text"
            placeholder="Nombre del paciente"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                       bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 
                       focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Estado
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                       bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 
                       focus:outline-none focus:ring-2 focus:ring-blue-600"
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Desde
          </label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                       bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 
                       focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Hasta
          </label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                       bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 
                       focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

            {/* Tabla */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-800 dark:text-gray-100">
          <thead className="bg-gray-100 dark:bg-gray-700 text-xs uppercase text-gray-600 dark:text-gray-300">
            <tr>
              <th className="px-4 py-2 border-b">Paciente</th>
              <th className="px-4 py-2 border-b">Fecha</th>
              <th className="px-4 py-2 border-b">Tipo</th>
              <th className="px-4 py-2 border-b">Estado</th>
              <th className="px-4 py-2 border-b">Monto esperado</th>
              <th className="px-4 py-2 border-b text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-4 text-center text-sm text-gray-500 dark:text-gray-400 italic"
                >
                  No hay citas con los filtros actuales.
                </td>
              </tr>
            )}

            {filtered.map((a) => (
              <tr key={a.id} className="border-b border-gray-200 dark:border-gray-700">
                <td className="px-4 py-2">
                  <div className="flex justify-between items-center">
                    <span>{a.patient.full_name}</span>
                    <a
                      href={`/patients/${a.patient.id}`}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Ver ficha
                    </a>
                  </div>
                </td>
                <td className="px-4 py-2">{formatDate(a.appointment_date)}</td>
                <td className="px-4 py-2">
                  {a.appointment_type === "general" ? "General" : "Especializada"}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${STATUS_CLASS[a.status]}`}
                  >
                    {STATUS_LABEL[a.status]}
                  </span>
                </td>
                <td className="px-4 py-2">{formatCurrency(a.expected_amount)}</td>
                <td className="px-4 py-2 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onSelect(a)}
                      className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 
                                 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 
                                 hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm"
                    >
                      Detalle
                    </button>
                    <button
                      disabled={a.status === "canceled" || a.status === "completed"}
                      onClick={() => onCancel?.(a.id)}
                      className={`px-3 py-1 rounded-md text-sm transition ${
                        a.status === "canceled" || a.status === "completed"
                          ? "border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                          : "bg-red-600 text-white hover:bg-red-700"
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
