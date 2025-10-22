import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
export default function WaivedConsultationForm({ onSubmit, consultation }) {
    const [form, setForm] = useState({
        patientId: consultation?.patientId || 0,
        reason: consultation?.reason || "",
        date: consultation?.date || "",
    });
    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(form);
    };
    return (_jsxs("form", { onSubmit: handleSubmit, children: [_jsx("input", { type: "number", name: "patientId", value: form.patientId, onChange: handleChange, placeholder: "ID del paciente" }), _jsx("textarea", { name: "reason", value: form.reason, onChange: handleChange, placeholder: "Motivo" }), _jsx("input", { type: "date", name: "date", value: form.date, onChange: handleChange }), _jsx("button", { type: "submit", children: "Guardar" })] }));
}
