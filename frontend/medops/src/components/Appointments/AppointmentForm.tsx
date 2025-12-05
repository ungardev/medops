// src/components/Appointments/AppointmentForm.tsx
import React, { useState } from "react";
import { AppointmentInput } from "types/appointments";
import type { Patient } from "types/patients";
import { usePatients } from "hooks/patients/usePatients";
import NewPatientModal from "components/Patients/NewPatientModal";
import { UserPlusIcon } from "@heroicons/react/24/outline";

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

  const [showNewPatientModal, setShowNewPatientModal] = useState(false);

  const { data, isLoading, isError, refetch } = usePatients(1, 50);
  const patientList: Patient[] = data?.results ?? [];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "patient" ? Number(value) || 0 : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.patient || form.patient === 0) {
      alert("Seleccione un paciente antes de guardar.");
      return;
    }

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
          <h2 className="text-lg font-semibold text-[#0d2c53] dark:text-gray-100">Nueva Cita</h2>
          <button
            type="button"
            className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 
                       bg-gray-100 dark:bg-gray-700 text-[#0d2c53] dark:text-gray-200 
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
            <label className="block text-sm font-medium text-[#0d2c53] dark:text-gray-300 mb-1">
              Paciente
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                {isLoading && <p className="text-sm text-[#0d2c53] dark:text-gray-400">Cargando pacientes...</p>}
                {isError && <p className="text-sm text-red-600 dark:text-red-400">No se pudo cargar la lista de pacientes.</p>}
                {!isLoading && !isError && (
                  <select
                    name="patient"
                    value={form.patient || ""}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                               bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100 
                               focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
                  >
                    <option value="">Seleccione un paciente</option>
                    {patientList.length === 0 ? (
                      <option value="" disabled>Lista de pacientes vacía</option>
                    ) : (
                      patientList.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.full_name} (ID: {p.id})
                        </option>
                      ))
                    )}
                  </select>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowNewPatientModal(true)}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 
                           hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                title="Registrar nuevo paciente"
              >
                <UserPlusIcon className="h-5 w-5 text-[#0d2c53] dark:text-gray-100" />
              </button>
            </div>
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-sm font-medium text-[#0d2c53] dark:text-gray-300 mb-1">Fecha</label>
            <input
              type="date"
              name="appointment_date"
              value={form.appointment_date}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                         bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100 
                         focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-[#0d2c53] dark:text-gray-300 mb-1">Tipo</label>
            <select
              name="appointment_type"
              value={form.appointment_type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                         bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100 
                         focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
            >
              <option value="general">General</option>
              <option value="specialized">Especializada</option>
            </select>
          </div>

          {/* Monto esperado */}
          <div>
            <label className="block text-sm font-medium text-[#0d2c53] dark:text-gray-300 mb-1">Monto esperado</label>
            <input
              type="text"
              name="expected_amount"
              value={form.expected_amount}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                         bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100 
                         focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
            />
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-[#0d2c53] dark:text-gray-300 mb-1">Notas</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                         bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100 
                         focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 
                         bg-gray-100 dark:bg-gray-700 text-[#0d2c53] dark:text-gray-200 
                         hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-[#0d2c53] text-white border border-[#0d2c53] hover:bg-[#0b2444] transition text-sm"
            >
              Guardar
            </button>
          </div>
        </form>

        {/* Modal de nuevo paciente */}
        {showNewPatientModal && (
          <NewPatientModal
            open={showNewPatientModal}
            onClose={() => {
              setShowNewPatientModal(false);
              refetch();
            }}
            onCreated={() => {
              // La firma actual no entrega el paciente; refrescamos la lista y mantenemos la selección manual.
              setShowNewPatientModal(false);
              refetch();
            }}
          />
        )}
      </div>
    </div>
  );
}
