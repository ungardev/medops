import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPayments, createPayment, updatePayment, deletePayment } from "api/payments";
import PaymentsList from "components/PaymentsList";
import PaymentForm from "components/PaymentForm";
import { useState } from "react";
export default function Payments() {
    const queryClient = useQueryClient();
    const [editingPayment, setEditingPayment] = useState(null);
    // 🔎 Cargar pagos
    const { data: payments, isLoading, isError, error } = useQuery({
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
        mutationFn: ({ id, data }) => updatePayment(id, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payments"] }),
    });
    // 🗑 Eliminar pago
    const deleteMutation = useMutation({
        mutationFn: deletePayment,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payments"] }),
    });
    const savePayment = (data, id) => {
        if (id) {
            updateMutation.mutate({ id, data });
            setEditingPayment(null);
        }
        else {
            createMutation.mutate(data);
        }
    };
    if (isLoading)
        return _jsx("p", { children: "Cargando pagos..." });
    if (isError)
        return _jsxs("p", { children: ["Error: ", error.message] });
    return (_jsxs("div", { children: [_jsx("h1", { children: "Pagos" }), _jsx(PaymentForm, { onSubmit: (data) => savePayment(data, editingPayment?.id), payment: editingPayment }), _jsx(PaymentsList, { payments: payments || [], onEdit: (p) => setEditingPayment(p), onDelete: (id) => deleteMutation.mutate(id) })] }));
}
