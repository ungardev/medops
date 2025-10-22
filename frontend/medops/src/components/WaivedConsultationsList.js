import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function WaivedConsultationsList({ consultations, onEdit, onDelete }) {
    return (_jsx("ul", { children: consultations.map((c) => (_jsxs("li", { children: ["Paciente #", c.patientId, " \u2014 ", c.reason, " (", c.date, ")", _jsx("button", { onClick: () => onEdit(c), children: "Editar" }), _jsx("button", { onClick: () => onDelete(c.id), children: "Eliminar" })] }, c.id))) }));
}
