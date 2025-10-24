import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getPayments } from "api/payments";
import { Payment } from "types/payments";

export default function PaymentsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [methodFilter, setMethodFilter] = useState<string>("");

  const { data: payments, isLoading, isError, error } = useQuery<Payment[]>({
    queryKey: ["payments"],
    queryFn: getPayments,
  });

  if (isLoading) return <p>Cargando pagos...</p>;
  if (isError) return <p>Error: {(error as Error).message}</p>;
  if (!payments) return <p>No se encontraron pagos</p>;

  // 🔹 Filtrado en frontend (más adelante podemos moverlo al backend)
  const filtered = payments.filter((p) => {
    return (
      (statusFilter ? p.status === statusFilter : true) &&
      (methodFilter ? p.method === methodFilter : true)
    );
  });

  return (
    <div>
      <h1>Gestión de Pagos</h1>

      {/* Filtros */}
      <div style={{ marginBottom: "1rem" }}>
        <label>
          Estado:
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="pending">Pendiente</option>
            <option value="paid">Pagado</option>
            <option value="canceled">Cancelado</option>
            <option value="waived">Exonerado</option>
          </select>
        </label>

        <label style={{ marginLeft: "1rem" }}>
          Método:
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="cash">Efectivo</option>
            <option value="card">Tarjeta</option>
            <option value="transfer">Transferencia</option>
          </select>
        </label>
      </div>

      {/* Tabla de pagos */}
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Cita</th>
            <th>Paciente</th>
            <th>Monto</th>
            <th>Método</th>
            <th>Estado</th>
            <th>Referencia</th>
            <th>Banco</th>
            <th>Recibido por</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((p) => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.appointment}</td>
              <td>{p.patient_name || "—"}</td>
              <td>{p.amount}</td>
              <td>{p.method}</td>
              <td>{p.status}</td>
              <td>{p.reference_number || "—"}</td>
              <td>{p.bank_name || "—"}</td>
              <td>{p.received_by || "—"}</td>
              <td>
                {p.received_at
                  ? new Date(p.received_at).toLocaleString()
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
