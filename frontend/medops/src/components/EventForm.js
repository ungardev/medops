import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
export default function EventForm({ onSubmit, event }) {
    const [form, setForm] = useState({
        title: event?.title || "",
        description: event?.description || "",
        date: event?.date || "",
    });
    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(form);
    };
    return (_jsxs("form", { onSubmit: handleSubmit, children: [_jsx("input", { name: "title", value: form.title, onChange: handleChange, placeholder: "T\u00EDtulo" }), _jsx("textarea", { name: "description", value: form.description, onChange: handleChange, placeholder: "Descripci\u00F3n" }), _jsx("input", { type: "date", name: "date", value: form.date, onChange: handleChange }), _jsx("button", { type: "submit", children: "Guardar" })] }));
}
