import React, { useState } from "react";
import { Appointment, AppointmentInput } from "types/appointments";

interface Props {
  appointment: Appointment;
  onClose: () => void;
  onSubmit?: (id: number, data: AppointmentInput) => void;
}

export default function AppointmentEditForm({ appointment, onClose, onSubmit }: Props) {
  // 🔹 Form inicial con valores seguros y paciente bloqueado
  const [form, setForm] = useState<AppointmentInput>({
    patient: appointment?.patient?.id ?? 0, // se envía igual pero no editable
    appointment_date: appointment?.appointment_date ?? "",
    appointment_type: appointment?.appointment_type ?? "general",
    expected_amount: String(appointment?.expected_amount ?? ""),
    // notas fuera por ahora
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === "patient") return; // protección extra: no permitir cambios en paciente
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: AppointmentInput = {
      ...form,
      expected_amount: form.expected_amount ? String(form.expected_amount) : "",
    };
    if (onSubmit && appointment?.id) {
      onSubmit(appointment.id, payload);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="max-w-lg w-full rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Editar Cita</h2>
          <button
            type="button"
            className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 
                       bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 
                       hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm"
            onClick={onClose}
          >
            ✖
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Paciente (readonly) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Paciente
            </label>
            <input
              type="text"
              value={`${appointment?.patient?.full_name ?? "Sin nombre"} (ID: ${appointment?.patient?.id ?? "—"})`}
              disabled
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                         bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
            />
            {/* Si se necesita acción separada en el futuro: botón discreto */}
            {/* <button type="button" className="mt-2 text-xs text-blue-600">Reasignar paciente</button> */}
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha
            </label>
            <input
              type="date"
              name="appointment_date"
              value={form.appointment_date}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                         bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 
                         focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo
            </label>
            <select
              name="appointment_type"
              value={form.appointment_type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                         bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 
                         focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="general">General</option>
              <option value="specialized">Especializada</option>
            </select>
          </div>

          {/* Monto esperado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Monto esperado
            </label>
            <input
              type="text"
              name="expected_amount"
              value={form.expected_amount}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                         bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 
                         focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Botones */}
          <div className="flex justify-between mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 
                         bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 
                         hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition text-sm"
            >
              Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
