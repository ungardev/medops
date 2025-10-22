import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function PaymentsList({ payments, onEdit, onDelete }) {
    return (_jsx("ul", { children: payments.map((p) => (_jsxs("li", { children: [p.patient, " \u2014 ", p.amount, " (", p.method, ") \u2014 ", p.date, _jsx("button", { onClick: () => onEdit(p), children: "Editar" }), _jsx("button", { onClick: () => onDelete(p.id), children: "Eliminar" })] }, p.id))) }));
}
