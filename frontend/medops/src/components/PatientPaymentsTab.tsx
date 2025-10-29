// src/components/PatientPaymentsTab.tsx
import { usePaymentsByPatient } from "../hooks/usePaymentsByPatient";
import { Payment } from "../types/payments";

interface Props {
  patientId: number;
}

export default function PatientPaymentsTab({ patientId }: Props) {
  const { data, isLoading, error } = usePaymentsByPatient(patientId);

  const payments = data?.list ?? [];
  const totalAmount = data?.totalAmount ?? 0;
  const isEmpty = !isLoading && !error && payments.length === 0;

  if (isLoading) return <p>Cargando pagos...</p>;
  if (error) return <p className="text-danger">Error: {error.message}</p>;
  if (isEmpty) return <p>No tiene pagos registrados</p>;

  return (
    <>
      <p>
        <strong>Total pagado:</strong> {totalAmount}
      </p>
      <table className="table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Monto</th>
            <th>Método</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p: Payment) => (
            <tr key={p.id}>
              <td>
                {p.received_at
                  ? new Date(p.received_at).toLocaleDateString()
                  : "—"}
              </td>
              <td>{p.amount}</td>
              <td>{p.method}</td>
              <td>{p.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
