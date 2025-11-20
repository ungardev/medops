// src/components/Appointments/AppointmentEditForm.tsx
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Appointment, AppointmentInput } from "types/appointments"; // 👈 import simplificado
import { getPatients } from "api/patients"; // 👈 import simplificado

interface Props {
  appointment: Appointment;
  onClose: () => void;
  onSubmit?: (id: number, data: AppointmentInput) => void;
}

export default function AppointmentEditForm({ appointment, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<AppointmentInput>({
    patient: appointment.patient.id,
    appointment_date: appointment.appointment_date,
    appointment_type: appointment.appointment_type,
    expected_amount: String(appointment.expected_amount ?? ""), // 👈 normalizamos a string
    notes: appointment.notes || "",
  });

  // 🔎 Cargar pacientes
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

    // 👇 normalizamos expected_amount a string antes de enviar
    const payload: AppointmentInput = {
      ...form,
      expected_amount: form.expected_amount ? String(form.expected_amount) : "",
    };

    if (onSubmit) onSubmit(appointment.id, payload);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {/* Header */}
        <div className="flex-between mb-16">
          <h2>Editar Cita</h2>
          <button type="button" className="btn btn-outline" onClick={onClose}>
            ✖
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex-col gap-16">
          {/* Paciente */}
          <div>
            <label className="label">Paciente:</label>
            {isLoading ? (
              <p className="text-muted">Cargando pacientes...</p>
            ) : (
              <select
                name="patient"
                value={form.patient}
                onChange={handleChange}
                required
                className="select"
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
            <label className="label">Fecha:</label>
            <input
              type="date"
              name="appointment_date"
              value={form.appointment_date}
              onChange={handleChange}
              required
              className="input"
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="label">Tipo:</label>
            <select
              name="appointment_type"
              value={form.appointment_type}
              onChange={handleChange}
              className="select"
            >
              <option value="general">General</option>
              <option value="specialized">Especializada</option>
            </select>
          </div>

          {/* Monto esperado */}
          <div>
            <label className="label">Monto esperado:</label>
            <input
              type="text"
              name="expected_amount"
              value={form.expected_amount}
              onChange={handleChange}
              className="input"
            />
          </div>

          {/* Notas */}
          <div>
            <label className="label">Notas:</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              className="textarea textarea--md"
            />
          </div>

          {/* Botones */}
          <div className="btn-row flex-between">
            <button type="button" onClick={onClose} className="btn btn-outline">
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}