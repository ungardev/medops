import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function AppointmentsList({ appointments, onEdit, onDelete }) {
    return (_jsx("ul", { children: appointments.map((a) => (_jsxs("li", { children: [a.patient, " con ", a.doctor, " \u2014 ", a.date, " \u2014 ", a.status, _jsx("button", { onClick: () => onEdit(a), children: "Editar" }), _jsx("button", { onClick: () => onDelete(a.id), children: "Eliminar" })] }, a.id))) }));
}
