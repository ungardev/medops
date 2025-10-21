import { WaivedConsultation } from "types/waivedConsultations";

interface Props {
  consultations: WaivedConsultation[];
  onEdit: (c: WaivedConsultation) => void;
  onDelete: (id: number) => void;
}

export default function WaivedConsultationsList({ consultations, onEdit, onDelete }: Props) {
  return (
    <ul>
      {consultations.map((c) => (
        <li key={c.id}>
          Paciente #{c.patientId} — {c.reason} ({c.date})
          <button onClick={() => onEdit(c)}>Editar</button>
          <button onClick={() => onDelete(c.id)}>Eliminar</button>
        </li>
      ))}
    </ul>
  );
}
