import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchWaitingRoom, updateAppointmentStatus } from "../api/waitingRoom";
export default function WaitingRoom() {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        fetchWaitingRoom()
            .then(data => setEntries(data))
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);
    const handleStatusChange = async (id, newStatus) => {
        try {
            await updateAppointmentStatus(id, newStatus); // PATCH al backend
            setEntries(prev => prev.map(e => (e.id === id ? { ...e, status: newStatus } : e)));
        }
        catch (err) {
            setError(err.message);
        }
    };
    if (loading)
        return _jsx("p", { children: "Cargando sala de espera..." });
    if (error)
        return _jsxs("p", { style: { color: "red" }, children: ["Error: ", error] });
    return (_jsxs("div", { children: [_jsx("h2", { children: "Sala de Espera" }), _jsxs("table", { style: { width: "100%", borderCollapse: "collapse" }, children: [_jsx("thead", { children: _jsxs("tr", { style: { background: "#e2e8f0" }, children: [_jsx("th", { children: "Paciente" }), _jsx("th", { children: "Estado" }), _jsx("th", { children: "Acci\u00F3n" })] }) }), _jsx("tbody", { children: entries.map(e => (_jsxs("tr", { style: { borderBottom: "1px solid #cbd5e1" }, children: [_jsx("td", { children: e.patient.name }), " ", _jsx("td", { children: e.status }), _jsxs("td", { children: [e.status === "pending" && (_jsx("button", { onClick: () => handleStatusChange(e.id, "arrived"), children: "Marcar llegada" })), e.status === "arrived" && (_jsxs(_Fragment, { children: [_jsx("button", { onClick: () => handleStatusChange(e.id, "in_consultation"), children: "Iniciar consulta" }), _jsx("button", { onClick: () => handleStatusChange(e.id, "canceled"), style: { marginLeft: "6px", color: "red" }, children: "Cancelar" })] })), e.status === "in_consultation" && (_jsxs(_Fragment, { children: [_jsx(Link, { to: `/consulta/${e.appointment}`, style: {
                                                        background: "#3b82f6",
                                                        color: "#fff",
                                                        padding: "6px 12px",
                                                        borderRadius: "4px",
                                                        textDecoration: "none",
                                                        marginRight: "6px"
                                                    }, children: "Ir a consulta" }), _jsx("button", { onClick: () => handleStatusChange(e.id, "completed"), children: "Finalizar" })] })), e.status === "completed" && _jsx("span", { children: "\u2714 Finalizada" }), e.status === "canceled" && _jsx("span", { children: "\u2716 Cancelada" })] })] }, e.id))) })] })] }));
}
