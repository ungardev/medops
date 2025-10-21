import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPayments, createPayment, updatePayment, deletePayment } from "api/payments";
import { Payment, PaymentInput } from "types/payments";
import PaymentsList from "components/PaymentsList";
import PaymentForm from "components/PaymentForm";
import { useState } from "react";

export default function Payments() {
  const queryClient = useQueryClient();
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);

  // 🔎 Cargar pagos
  const { data: payments, isLoading, isError, error } = useQuery<Payment[]>({
    queryKey: ["payments"],
    queryFn: getPayments,
  });

  // ✍️ Crear pago
  const createMutation = useMutation({
    mutationFn: createPayment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payments"] }),
  });

  // ✍️ Actualizar pago
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: PaymentInput }) =>
      updatePayment(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payments"] }),
  });

  // 🗑 Eliminar pago
  const deleteMutation = useMutation({
    mutationFn: deletePayment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payments"] }),
  });

  const savePayment = (data: PaymentInput, id?: number) => {
    if (id) {
      updateMutation.mutate({ id, data });
      setEditingPayment(null);
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) return <p>Cargando pagos...</p>;
  if (isError) return <p>Error: {(error as Error).message}</p>;

  return (
    <div>
      <h1>Pagos</h1>
      <PaymentForm
        onSubmit={(data) => savePayment(data, editingPayment?.id)}
        payment={editingPayment}
      />
      <PaymentsList
        payments={payments || []}
        onEdit={(p) => setEditingPayment(p)}
        onDelete={(id) => deleteMutation.mutate(id)}
      />
    </div>
  );
}
