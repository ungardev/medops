import { Event } from "types/events";
interface Props {
  events: Event[];
  onEdit: (e: Event) => void;
  onDelete: (id: number) => void;
}
export default function EventsList({ events, onEdit, onDelete }: Props) {
  return (
    <ul>
      {events.map((e) => (
        <li key={e.id}>
          {e.title} — {e.timestamp ? e.timestamp.slice(0, 10) : ""}
          <button onClick={() => onEdit(e)}>Editar</button>
          <button onClick={() => onDelete(e.id)}>Eliminar</button>
        </li>
      ))}
    </ul>
  );
}