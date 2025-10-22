import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getWaivedConsultations, createWaivedConsultation, updateWaivedConsultation, deleteWaivedConsultation, } from "api/waivedConsultations";
import WaivedConsultationsList from "components/WaivedConsultationsList";
import WaivedConsultationForm from "components/WaivedConsultationForm";
export default function WaivedConsultations() {
    const queryClient = useQueryClient();
    const [editing, setEditing] = useState(null);
    // 🔎 Query principal
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ["waivedConsultations"],
        queryFn: getWaivedConsultations,
    });
    // ➕ Crear
    const createMutation = useMutation({
        mutationFn: createWaivedConsultation,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["waivedConsultations"] }),
    });
    // ✏️ Actualizar
    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => updateWaivedConsultation(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["waivedConsultations"] });
            setEditing(null);
        },
    });
    // ❌ Eliminar
    const deleteMutation = useMutation({
        mutationFn: deleteWaivedConsultation,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["waivedConsultations"] }),
    });
    if (isLoading)
        return _jsx("p", { children: "Cargando..." });
    if (isError)
        return _jsxs("p", { children: ["Error: ", error.message] });
    return (_jsxs("div", { children: [_jsx("h1", { children: "Consultas exoneradas" }), _jsx(WaivedConsultationForm, { consultation: editing, onSubmit: (formData) => {
                    if (editing) {
                        updateMutation.mutate({ id: editing.id, data: formData });
                    }
                    else {
                        createMutation.mutate(formData);
                    }
                } }), _jsx(WaivedConsultationsList, { consultations: data || [], onEdit: (c) => setEditing(c), onDelete: (id) => deleteMutation.mutate(id) })] }));
}
