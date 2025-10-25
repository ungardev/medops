import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getPayments, createPayment } from "api/payments";
import { Payment, PaymentInput } from "types/payments";
import PaymentForm from "components/PaymentForm";
import {
  exportPaymentsToCSV,
  exportPaymentsToXLSX,
  exportPaymentsToPDF,
} from "utils/export";

export default function Payments() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [methodFilter, setMethodFilter] = useState<string>("");

  const {
    data: payments,
    isLoading,
    isError,
    error,
  } = useQuery<Payment[]>({
    queryKey: ["payments"],
    queryFn: getPayments,
  });

  const createMutation = useMutation({
    mutationFn: (input: PaymentInput) => createPayment(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payments"] }),
  });

  if (isLoading) return <p>Cargando pagos...</p>;
  if (isError) return <p>Error: {(error as Error).message}</p>;
  if (!payments) return <p>No se encontraron pagos</p>;

  const filtered = payments.filter((p) => {
    return (
      (statusFilter ? p.status === statusFilter : true) &&
      (methodFilter ? p.method === methodFilter : true)
    );
  });

  return (
    <div>
      <h1>Gestión de Pagos</h1>

      {/* Crear nuevo pago */}
      <div style={{ marginBottom: "2rem" }}>
        <h2>Registrar Pago</h2>
        <PaymentForm onSubmit={(data) => createMutation.mutate(data)} />
      </div>

      {/* Filtros + Exportación */}
      <div
        style={{
          marginBottom: "1rem",
          display: "flex",
          gap: "1rem",
          alignItems: "center",
        }}
      >
        <div>
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

        {/* 🔹 Menú de exportación */}
        <div style={{ position: "relative" }}>
          <button
            onClick={(e) => {
              const menu = document.getElementById("export-menu");
              if (menu) menu.classList.toggle("show");
            }}
          >
            📤 Exportar
          </button>
          <ul
            id="export-menu"
            style={{
              display: "none",
              position: "absolute",
              background: "white",
              border: "1px solid #ccc",
              listStyle: "none",
              margin: 0,
              padding: "0.5rem",
              zIndex: 10,
            }}
          >
            <li
              style={{ cursor: "pointer" }}
              onClick={() => exportPaymentsToCSV(filtered)}
            >
              Exportar CSV
            </li>
            <li
              style={{ cursor: "pointer" }}
              onClick={() => exportPaymentsToXLSX(filtered)}
            >
              Exportar Excel
            </li>
            <li
              style={{ cursor: "pointer" }}
              onClick={() => exportPaymentsToPDF(filtered)}
            >
              Exportar PDF
            </li>
          </ul>
        </div>
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
              <td>{p.patient?.full_name || "—"}</td> {/* ✅ corregido */}
              <td>{p.amount}</td>
              <td>{p.method}</td>
              <td>{p.status}</td>
              <td>{p.reference_number || "—"}</td>
              <td>{p.bank_name || "—"}</td>
              <td>{p.received_by || "—"}</td>
              <td>
                {p.received_at
                  ? new Date(p.received_at).toLocaleString("es-VE")
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
