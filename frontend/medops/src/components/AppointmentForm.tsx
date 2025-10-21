import { useState } from "react";
import { Appointment, AppointmentInput } from "../types/appointments";

interface Props {
  onSubmit: (data: AppointmentInput) => void;
  appointment?: Appointment | null;
}

export default function AppointmentForm({ onSubmit, appointment }: Props) {
  const [form, setForm] = useState<AppointmentInput>({
    patient: appointment?.patient || "",
    doctor: appointment?.doctor || "",
    date: appointment?.date || "",
    status: appointment?.status || "scheduled",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="patient"
        value={form.patient}
        onChange={handleChange}
        placeholder="Paciente"
      />
      <input
        name="doctor"
        value={form.doctor}
        onChange={handleChange}
        placeholder="Doctor"
      />
      <input
        type="date"
        name="date"
        value={form.date}
        onChange={handleChange}
      />
      <select name="status" value={form.status} onChange={handleChange}>
        <option value="scheduled">Programada</option>
        <option value="completed">Completada</option>
        <option value="cancelled">Cancelada</option>
      </select>
      <button type="submit">Guardar</button>
    </form>
  );
}
