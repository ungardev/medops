import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
export default function PatientForm({ onSubmit, patient }) {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [age, setAge] = useState(0);
    const [diagnosis, setDiagnosis] = useState("");
    useEffect(() => {
        if (patient) {
            const [first, last] = patient.name.split(" ");
            setFirstName(first || "");
            setLastName(last || "");
            setAge(patient.age);
            setDiagnosis(patient.diagnosis);
        }
    }, [patient]);
    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ first_name: firstName, last_name: lastName, age, diagnosis });
        setFirstName("");
        setLastName("");
        setAge(0);
        setDiagnosis("");
    };
    return (_jsxs("form", { onSubmit: handleSubmit, children: [_jsx("h2", { children: patient ? "Editar Paciente" : "Nuevo Paciente" }), _jsx("input", { type: "text", placeholder: "Nombre", value: firstName, onChange: (e) => setFirstName(e.target.value), required: true }), _jsx("input", { type: "text", placeholder: "Apellido", value: lastName, onChange: (e) => setLastName(e.target.value), required: true }), _jsx("input", { type: "number", placeholder: "Edad", value: age, onChange: (e) => setAge(Number(e.target.value)), required: true }), _jsx("input", { type: "text", placeholder: "Diagn\u00F3stico", value: diagnosis, onChange: (e) => setDiagnosis(e.target.value), required: true }), _jsx("button", { type: "submit", children: patient ? "Actualizar" : "Crear" })] }));
}
