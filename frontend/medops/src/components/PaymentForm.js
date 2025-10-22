import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
export default function PaymentForm({ onSubmit, payment }) {
    const [form, setForm] = useState({
        patient: payment?.patient || "",
        amount: payment?.amount || 0,
        method: payment?.method || "cash",
        date: payment?.date || "",
    });
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: name === "amount" ? Number(value) : value });
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(form);
    };
    return (_jsxs("form", { onSubmit: handleSubmit, children: [_jsx("input", { name: "patient", value: form.patient, onChange: handleChange, placeholder: "Paciente" }), _jsx("input", { type: "number", name: "amount", value: form.amount, onChange: handleChange, placeholder: "Monto" }), _jsxs("select", { name: "method", value: form.method, onChange: handleChange, children: [_jsx("option", { value: "cash", children: "Efectivo" }), _jsx("option", { value: "card", children: "Tarjeta" }), _jsx("option", { value: "transfer", children: "Transferencia" })] }), _jsx("input", { type: "date", name: "date", value: form.date, onChange: handleChange }), _jsx("button", { type: "submit", children: "Guardar" })] }));
}
