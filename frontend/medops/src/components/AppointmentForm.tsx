// src/components/AppointmentForm.tsx
import { useState } from "react";
import {
  Appointment,
  AppointmentInput,
  AppointmentStatus,
} from "../types/appointments";

interface Props {
  onSubmit: (data: AppointmentInput) => void;
  appointment?: Appointment | null;
}

export default function AppointmentForm({ onSubmit, appointment }: Props) {
  const [form, setForm] = useState<AppointmentInput>({
    patient: appointment?.patient?.id ?? 0,                 // number (ID del paciente)
    appointment_date: appointment?.appointment_date ?? "",  // YYYY-MM-DD
    appointment_type: appointment?.appointment_type ?? "general",
    expected_amount: appointment?.expected_amount ?? "",
    status: appointment?.status ?? ("pending" as AppointmentStatus),
    notes: appointment?.notes ?? "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    // Convertir patient a número si lo estás editando manualmente
    if (name === "patient") {
      setForm((prev) => ({ ...prev, patient: Number(value) }));
      return;
    }

    // Asegurar que status siempre sea del tipo AppointmentStatus (union)
    if (name === "status") {
      setForm((prev) => ({ ...prev, status: value as AppointmentStatus }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ID del paciente (si luego seleccionas desde un buscador, este input puede desaparecer) */}
      <input
        type="number"
        name="patient"
        value={form.patient}
        onChange={handleChange}
        placeholder="ID del paciente"
      />

      <input
        type="date"
        name="appointment_date"
        value={form.appointment_date}
        onChange={handleChange}
      />

      <select
        name="appointment_type"
        value={form.appointment_type}
        onChange={handleChange}
      >
        <option value="general">Consulta general</option>
        <option value="specialized">Consulta especializada</option>
      </select>

      <input
        type="text"
        name="expected_amount"
        value={form.expected_amount ?? ""}
        onChange={handleChange}
        placeholder="Monto esperado"
      />

      <select name="status" value={form.status ?? "pending"} onChange={handleChange}>
        <option value="pending">Pendiente</option>
        <option value="arrived">Llegó</option>
        <option value="in_consultation">En consulta</option>
        <option value="completed">Completada</option>
        <option value="canceled">Cancelada</option>
      </select>

      <textarea
        name="notes"
        value={form.notes ?? ""}
        onChange={handleChange}
        placeholder="Notas"
      />

      <button type="submit">Guardar</button>
    </form>
  );
}
