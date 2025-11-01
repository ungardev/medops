import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPayments, deletePayment, updatePayment } from "../../api/payments";
import { Payment, PaymentStatus, PaymentInput } from "../../types/payments";
import { toPaymentInputPartial } from "../../utils/payments";

import PageHeader from "../../components/Layout/PageHeader";
import PaymentList from "../../components/Payments/PaymentList";
import PendingPaymentsModal from "../../components/Payments/PendingPaymentsModal";
import { useAppointmentsPending, AppointmentPending } from "../../hooks/appointments/useAppointmentsPending";
import { useState } from "react";

export default function Payments() {
  const queryClient = useQueryClient();

  const [showPendingModal, setShowPendingModal] = useState(false);

  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "all">("all");
  const [methodFilter, setMethodFilter] = useState<
    "all" | "cash" | "card" | "transfer"
  >("all");

  // 🔹 Pagos globales (auditoría)
  const {
    data: payments = [],
    isLoading,
    isError,
    error,
  } = useQuery<Payment[]>({
    queryKey: ["payments"],
    queryFn: getPayments,
  });

  // 🔹 Citas pendientes (hook nuevo con financial_status)
  const {
    data: appointmentsPending = [],
    isLoading: loadingAppointments,
    isError: errorAppointments,
  } = useAppointmentsPending();

  const deleteMutation = useMutation({
    mutationFn: deletePayment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payments"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<PaymentInput> }) =>
      updatePayment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["appointments", "pending"] }); // 👈 refrescar citas pendientes
    },
  });

  if (isLoading) return <p>Cargando pagos...</p>;
  if (isError) return <p>Error: {(error as Error).message}</p>;

  // 🔹 Filtrado
  const filteredPayments = payments
    .filter((p) => (statusFilter === "all" ? true : p.status === statusFilter))
    .filter((p) => (methodFilter === "all" ? true : p.method === methodFilter));

  // 🔹 Resumen financiero global (solo para auditoría)
  const expectedTotal = filteredPayments.reduce(
    (sum, p) => sum + parseFloat(p.amount),
    0
  );
  const totalPaid = filteredPayments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);
  const balance = expectedTotal - totalPaid;

  // 🔹 Agrupar pagos por cita (para el modal)
  const paymentsByAppointment: Record<number, Payment[]> = {};
  payments.forEach((p) => {
    if (!paymentsByAppointment[p.appointment]) {
      paymentsByAppointment[p.appointment] = [];
    }
    paymentsByAppointment[p.appointment].push(p);
  });

  return (
    <div>
      {/* Encabezado */}
      <PageHeader title="Pagos" />

      {/* Resumen con badges ejecutivos */}
      <div className="flex gap-4 mb-4">
        <span className="badge badge-muted">
          Esperado: {expectedTotal.toFixed(2)}
        </span>
        <span className="badge badge-success">
          Recibido: {totalPaid.toFixed(2)}
        </span>
        <span
          className={`badge ${
            balance > 0 ? "badge-warning" : "badge-success"
          }`}
        >
          Pendiente: {balance > 0 ? balance.toFixed(2) : "0.00"}
        </span>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-4">
        {["all", "pending", "paid", "canceled", "waived"].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status as PaymentStatus | "all")}
            className={`btn ${
              statusFilter === status ? "btn-primary" : "btn-outline"
            }`}
          >
            {status === "all" && "Todos"}
            {status === "pending" && "Pendientes"}
            {status === "paid" && "Pagados"}
            {status === "canceled" && "Cancelados"}
            {status === "waived" && "Exonerados"}
          </button>
        ))}

        {["all", "cash", "card", "transfer"].map((method) => (
          <button
            key={method}
            onClick={() => setMethodFilter(method as any)}
            className={`btn ${
              methodFilter === method ? "btn-primary" : "btn-outline"
            }`}
          >
            {method === "all" && "Todos los métodos"}
            {method === "cash" && "Efectivo"}
            {method === "card" && "Tarjeta"}
            {method === "transfer" && "Transferencia"}
          </button>
        ))}

        <button
          onClick={() => setShowPendingModal(true)}
          className="btn btn-warning"
        >
          Citas con pagos pendientes
        </button>
      </div>

      {/* Tabla de pagos (auditoría global) */}
      <PaymentList
        payments={filteredPayments}
        onDelete={(id) => {
          if (window.confirm("¿Seguro que desea eliminar este pago?")) {
            deleteMutation.mutate(id);
          }
        }}
        onEditInline={(id, data) => {
          const payload = toPaymentInputPartial(data);
          updateMutation.mutate({ id, data: payload });
        }}
      />

      {/* Modal de pagos pendientes */}
      {showPendingModal && (
        <PendingPaymentsModal
          open={showPendingModal}
          onClose={() => setShowPendingModal(false)}
          appointments={appointmentsPending as AppointmentPending[]} // 👈 incluye financial_status
          paymentsByAppointment={paymentsByAppointment}
          onAddPayment={(appointmentId, data) => {
            updateMutation.mutate({ id: appointmentId, data });
          }}
        />
      )}
    </div>
  );
}
