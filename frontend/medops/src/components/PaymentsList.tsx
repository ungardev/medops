import { Payment } from "../types/payments";

interface Props {
  payments: Payment[];
  onEdit: (p: Payment) => void;
  onDelete: (id: number) => void;
}

export default function PaymentsList({ payments, onEdit, onDelete }: Props) {
  return (
    <ul>
      {payments.map((p) => (
        <li key={p.id}>
          {p.patient} — {p.amount} ({p.method}) — {p.date}
          <button onClick={() => onEdit(p)}>Editar</button>
          <button onClick={() => onDelete(p.id)}>Eliminar</button>
        </li>
      ))}
    </ul>
  );
}
