import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function PatientsList({ patients, onEdit, onDelete }) {
    return (_jsxs("div", { children: [_jsx("h2", { children: "Lista de Pacientes" }), _jsx("ul", { children: patients.map((p) => (_jsxs("li", { children: [p.name, " \u2014 ", p.age, " a\u00F1os \u2014 ", p.diagnosis, _jsx("button", { onClick: () => onEdit(p), children: "\u270F\uFE0F Editar" }), _jsx("button", { onClick: () => onDelete(p.id), children: "\uD83D\uDDD1 Eliminar" })] }, p.id))) })] }));
}
