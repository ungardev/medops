import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPayments,
  getPaymentsByPatient,
  createPayment,
  updatePayment,
  deletePayment,
} from "../../api/payments";
import { Payment, PaymentInput } from "../../types/payments";

// 🔹 Hook para listar todos los pagos
export function usePayments() {
  return useQuery<Payment[]>({
    queryKey: ["payments"],
    queryFn: getPayments,
  });
}

// 🔹 Hook para listar pagos de un paciente específico
export function usePaymentsByPatient(patientId: number) {
  return useQuery<Payment[]>({
    queryKey: ["patients", patientId, "payments"],
    queryFn: () => getPaymentsByPatient(patientId),
    enabled: !!patientId,
  });
}

// 🔹 Mutaciones
export function usePaymentMutations() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: (data: PaymentInput) => createPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<PaymentInput> }) =>
      updatePayment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });

  const remove = useMutation({
    mutationFn: (id: number) => deletePayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });

  return { create, update, remove };
}
