import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function EventsList({ events, onEdit, onDelete }) {
    return (_jsx("ul", { children: events.map((e) => (_jsxs("li", { children: [e.title, " \u2014 ", e.date, _jsx("button", { onClick: () => onEdit(e), children: "Editar" }), _jsx("button", { onClick: () => onDelete(e.id), children: "Eliminar" })] }, e.id))) }));
}
