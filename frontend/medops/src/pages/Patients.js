import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";
export default function Patients() {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        apiFetch("patients/")
            .then(data => {
            setPatients(data);
            setLoading(false);
        })
            .catch(err => {
            setError(err.message);
            setLoading(false);
        });
    }, []);
    if (loading)
        return _jsx("p", { children: "Cargando pacientes..." });
    if (error)
        return _jsxs("p", { children: ["Error: ", error] });
    return (_jsxs("div", { children: [_jsx("h1", { children: "Pacientes" }), _jsx("ul", { children: patients.map(p => (_jsxs("li", { children: [p.name, " \u2014 ", p.age, " a\u00F1os \u2014 ", p.diagnosis] }, p.id))) })] }));
}
