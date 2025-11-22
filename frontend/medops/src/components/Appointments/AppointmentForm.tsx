// src/components/Appointments/AppointmentForm.tsx
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppointmentInput } from "types/appointments";
import { getPatients } from "api/patients";

interface Props {
  date?: Date;
  onClose: () => void;
  onSubmit: (data: AppointmentInput) => void;
}

export default function AppointmentForm({ date, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<AppointmentInput>({
    patient: 0,
    appointment_date: date ? date.toISOString().slice(0, 10) : "",
    appointment_type: "general",
    expected_amount: "",
    notes: "",
  });

  const { data: patients, isLoading } = useQuery({
    queryKey: ["patients"],
    queryFn: getPatients,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: AppointmentInput = {
      ...form,
      expected_amount: form.expected_amount ? String(form.expected_amount) : "",
    };
    onSubmit(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="max-w-lg w-full rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Nueva Cita</h2>
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
          {/* Paciente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Paciente
            </label>
            {isLoading ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">Cargando pacientes...</p>
            ) : (
              <select
                name="patient"
                value={form.patient}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                           bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 
                           focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="">Seleccione un paciente</option>
                {patients?.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} (ID: {p.id})
                  </option>
                ))}
              </select>
            )}
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

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notas
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
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
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
