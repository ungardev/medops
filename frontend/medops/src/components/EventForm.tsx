import { useState } from "react";
import { ClinicEvent, ClinicEventInput } from "types/events";

interface Props {
  onSubmit: (data: ClinicEventInput) => void;
  event?: ClinicEvent | null;
}

export default function EventForm({ onSubmit, event }: Props) {
  const [form, setForm] = useState<ClinicEventInput>({
    title: event?.title || "",
    description: event?.description || "",
    date: event?.date || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="title"
        value={form.title}
        onChange={handleChange}
        placeholder="Título"
      />
      <textarea
        name="description"
        value={form.description}
        onChange={handleChange}
        placeholder="Descripción"
      />
      <input
        type="date"
        name="date"
        value={form.date}
        onChange={handleChange}
      />
      <button type="submit">Guardar</button>
    </form>
  );
}
