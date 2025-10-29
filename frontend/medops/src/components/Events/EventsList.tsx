import { ClinicEvent } from "types/events";

interface Props {
  events: ClinicEvent[];
  onEdit: (e: ClinicEvent) => void;
  onDelete: (id: number) => void;
}

export default function EventsList({ events, onEdit, onDelete }: Props) {
  return (
    <ul>
      {events.map((e) => (
        <li key={e.id}>
          {e.title} — {e.date}
          <button onClick={() => onEdit(e)}>Editar</button>
          <button onClick={() => onDelete(e.id)}>Eliminar</button>
        </li>
      ))}
    </ul>
  );
}
