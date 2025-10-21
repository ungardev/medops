import { Appointment } from "../types/appointments";

interface Props {
  appointments: Appointment[];
  onEdit: (a: Appointment) => void;
  onDelete: (id: number) => void;
}

export default function AppointmentsList({ appointments, onEdit, onDelete }: Props) {
  return (
    <ul>
      {appointments.map((a) => (
        <li key={a.id}>
          {a.patient} con {a.doctor} — {a.date} — {a.status}
          <button onClick={() => onEdit(a)}>Editar</button>
          <button onClick={() => onDelete(a.id)}>Eliminar</button>
        </li>
      ))}
    </ul>
  );
}
