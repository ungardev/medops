import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { fetchWaitingRoom } from "../api/waitingRoom";
export default function WaitingRoom() {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        console.log("🔎 Montando WaitingRoom, lanzando fetch...");
        fetchWaitingRoom()
            .then(data => {
            console.log("✅ Datos recibidos:", data);
            setEntries(data);
        })
            .catch(err => {
            console.error("❌ Error en fetch:", err);
            setError(err.message);
        })
            .finally(() => setLoading(false));
    }, []);
    if (loading)
        return _jsx("p", { children: "Cargando sala de espera..." });
    if (error)
        return _jsxs("p", { style: { color: "red" }, children: ["Error: ", error] });
    return (_jsxs("div", { children: [_jsx("h2", { children: "Sala de Espera" }), _jsx("ul", { children: entries.map(e => (_jsxs("li", { children: ["Paciente #", e.patient, " \u2014 creado:", " ", new Date(e.created_at).toLocaleTimeString()] }, e.id))) })] }));
}
