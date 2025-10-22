import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
export default function AppointmentForm({ onSubmit, appointment }) {
    const [form, setForm] = useState({
        patient: appointment?.patient || "",
        doctor: appointment?.doctor || "",
        date: appointment?.date || "",
        status: appointment?.status || "scheduled",
    });
    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(form);
    };
    return (_jsxs("form", { onSubmit: handleSubmit, children: [_jsx("input", { name: "patient", value: form.patient, onChange: handleChange, placeholder: "Paciente" }), _jsx("input", { name: "doctor", value: form.doctor, onChange: handleChange, placeholder: "Doctor" }), _jsx("input", { type: "date", name: "date", value: form.date, onChange: handleChange }), _jsxs("select", { name: "status", value: form.status, onChange: handleChange, children: [_jsx("option", { value: "scheduled", children: "Programada" }), _jsx("option", { value: "completed", children: "Completada" }), _jsx("option", { value: "cancelled", children: "Cancelada" })] }), _jsx("button", { type: "submit", children: "Guardar" })] }));
}
