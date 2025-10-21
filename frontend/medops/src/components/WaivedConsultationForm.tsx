import { useState } from "react";
import { WaivedConsultation, WaivedConsultationInput } from "types/waivedConsultations";

interface Props {
  onSubmit: (data: WaivedConsultationInput) => void;
  consultation?: WaivedConsultation | null;
}

export default function WaivedConsultationForm({ onSubmit, consultation }: Props) {
  const [form, setForm] = useState<WaivedConsultationInput>({
    patientId: consultation?.patientId || 0,
    reason: consultation?.reason || "",
    date: consultation?.date || "",
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
        type="number"
        name="patientId"
        value={form.patientId}
        onChange={handleChange}
        placeholder="ID del paciente"
      />
      <textarea
        name="reason"
        value={form.reason}
        onChange={handleChange}
        placeholder="Motivo"
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
