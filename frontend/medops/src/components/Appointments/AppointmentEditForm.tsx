// src/components/Appointments/AppointmentEditForm.tsx
import React, { useState } from "react";
import { Appointment, AppointmentInput } from "types/appointments";

interface Props {
  appointment: Appointment;
  onClose: () => void;
  onSubmit?: (id: number, data: AppointmentInput) => void;
}

export default function AppointmentEditForm({ appointment, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<AppointmentInput>({
    patient: appointment?.patient?.id ?? 0,
    appointment_date: appointment?.appointment_date ?? "",
    appointment_type: appointment?.appointment_type ?? "general",
    expected_amount: String(appointment?.expected_amount ?? ""),
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === "patient") return;
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-3 sm:px-0">
      <div className="max-w-md sm:max-w-lg w-full max-h-[85vh] overflow-y-auto rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 sm:p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h2 className="text-sm sm:text-lg font-semibold text-[#0d2c53] dark:text-gray-100">Editar Cita</h2>
          <button
            type="button"
            className="px-2 sm:px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 
                       bg-gray-100 dark:bg-gray-700 text-[#0d2c53] dark:text-gray-200 
                       hover:bg-gray-200 dark:hover:bg-gray-600 transition text-xs sm:text-sm"
            onClick={onClose}
          >
            ✖
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {/* Paciente (readonly) */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-[#0d2c53] dark:text-gray-300 mb-1.5">
              Paciente
            </label>
            <input
              type="text"
              value={`${appointment?.patient?.full_name ?? "Sin nombre"} (ID: ${appointment?.patient?.id ?? "—"})`}
              disabled
              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-md text-xs sm:text-sm 
                         bg-gray-100 dark:bg-gray-800 text-[#0d2c53] dark:text-gray-200"
            />
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-[#0d2c53] dark:text-gray-300 mb-1.5">
              Fecha
            </label>
            <input
              type="date"
              name="appointment_date"
              value={form.appointment_date}
              onChange={handleChange}
              required
              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-md text-xs sm:text-sm 
                         bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100 
                         focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-[#0d2c53] dark:text-gray-300 mb-1.5">
              Tipo
            </label>
            <select
              name="appointment_type"
              value={form.appointment_type}
              onChange={handleChange}
              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-md text-xs sm:text-sm 
                         bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100 
                         focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
            >
              <option value="general">General</option>
              <option value="specialized">Especializada</option>
            </select>
          </div>

          {/* Monto esperado */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-[#0d2c53] dark:text-gray-300 mb-1.5">
              Monto esperado
            </label>
            <input
              type="text"
              name="expected_amount"
              value={form.expected_amount}
              onChange={handleChange}
              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-md text-xs sm:text-sm 
                         bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100 
                         focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-2 mt-4 sm:mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-md border border-gray-300 dark:border-gray-600 
                         bg-gray-100 dark:bg-gray-700 text-[#0d2c53] dark:text-gray-200 
                         hover:bg-gray-200 dark:hover:bg-gray-600 transition text-xs sm:text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-md bg-[#0d2c53] text-white border border-[#0d2c53] hover:bg-[#0b2444] transition text-xs sm:text-sm"
            >
              Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
