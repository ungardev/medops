// src/components/Appointments/AppointmentTable.tsx
import React, { useMemo, useState } from "react";
import { Appointment, AppointmentStatus } from "../../types/appointments";
import { formatCurrency } from "@/utils/format";  // ✅ AGREGADO: Import de formatCurrency
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
  // Función para formatear fechas de forma segura
  const formatSafeDate = (dateISO: string): string => {
    try {
      const date = new Date(dateISO);
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateISO;
    }
  };
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
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-md">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800">
              <th className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                Paciente
              </th>
              <th className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                Fecha
              </th>
              <th className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                Estado
              </th>
              <th className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                Monto estimado
              </th>
              <th className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                >
                  No hay citas que coincidan con los filtros
                </td>
              </tr>
            ) : (
              filtered.map((a) => (
                <tr
                  key={a.id}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition cursor-pointer ${STATUS_CLASS[a.status]}`}
                  onClick={() => onSelect(a)}
                >
                  <td className="px-4 py-2 border-b border-gray-200 dark:border-gray-600">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {a.patient.full_name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {a.patient.national_id}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2 border-b border-gray-200 dark:border-gray-600">
                    {formatSafeDate(a.appointment_date)}
                  </td>
                  <td className="px-4 py-2 border-b border-gray-200 dark:border-gray-600">
                    <span
                      className={`px-2 py-1 rounded-md text-xs font-medium ${STATUS_CLASS[a.status]}`}
                    >
                      {STATUS_LABEL[a.status]}
                    </span>
                  </td>
                  <td className="px-4 py-2 border-b border-gray-200 dark:border-gray-600">
                    {formatCurrency(a.expected_amount)}  {/* ✅ Usa formatCurrency desde @/utils/format */}
                  </td>
                  <td className="px-4 py-2 border-b border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-2">
                      {onCancel && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onCancel(a.id);
                          }}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition text-sm"
                        >
                          Cancelar
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(a);
                        }}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition text-sm"
                      >
                        Ver detalles
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            Total de citas
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
            {filtered.length}
          </div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-md border border-green-200 dark:border-green-800">
          <div className="text-sm text-green-800 dark:text-green-300 font-medium">
            Completadas
          </div>
          <div className="text-2xl font-bold text-green-900 dark:text-green-200 mt-1">
            {filtered.filter((a) => a.status === "completed").length}
          </div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md border border-yellow-200 dark:border-yellow-800">
          <div className="text-sm text-yellow-800 dark:text-yellow-300 font-medium">
            Pendientes
          </div>
          <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-200 mt-1">
            {filtered.filter((a) => a.status === "pending").length}
          </div>
        </div>
      </div>
    </div>
  );
}