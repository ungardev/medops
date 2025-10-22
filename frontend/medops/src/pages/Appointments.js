import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAppointments, createAppointment, updateAppointment, deleteAppointment } from "api/appointments";
import AppointmentsList from "components/AppointmentsList";
import AppointmentForm from "components/AppointmentForm";
import { useState } from "react";
export default function Appointments() {
    const queryClient = useQueryClient();
    const [editingAppointment, setEditingAppointment] = useState(null);
    // 🔎 Cargar citas
    const { data: appointments, isLoading, isError, error } = useQuery({
        queryKey: ["appointments"],
        queryFn: getAppointments,
    });
    // ✍️ Crear cita
    const createMutation = useMutation({
        mutationFn: createAppointment,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["appointments"] }),
    });
    // ✍️ Actualizar cita
    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => updateAppointment(id, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["appointments"] }),
    });
    // 🗑 Eliminar cita
    const deleteMutation = useMutation({
        mutationFn: deleteAppointment,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["appointments"] }),
    });
    const saveAppointment = (data, id) => {
        if (id) {
            updateMutation.mutate({ id, data });
            setEditingAppointment(null);
        }
        else {
            createMutation.mutate(data);
        }
    };
    if (isLoading)
        return _jsx("p", { children: "Cargando citas..." });
    if (isError)
        return _jsxs("p", { children: ["Error: ", error.message] });
    return (_jsxs("div", { children: [_jsx("h1", { children: "Citas" }), _jsx(AppointmentForm, { onSubmit: (data) => saveAppointment(data, editingAppointment?.id), appointment: editingAppointment }), _jsx(AppointmentsList, { appointments: appointments || [], onEdit: (a) => setEditingAppointment(a), onDelete: (id) => deleteMutation.mutate(id) })] }));
}
