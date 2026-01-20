import { useState } from "react";
import { Event, CreateEventInput } from "types/events";
interface Props {
  onSubmit: (data: CreateEventInput) => void;
  event?: Event | null;
}
export default function EventForm({ onSubmit, event }: Props) {
  const [form, setForm] = useState<CreateEventInput>({
    title: event?.title || "",
    description: event?.description || "",
    date: event?.timestamp ? event.timestamp.slice(0, 10) : "",
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