import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";
export default function Dashboard() {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        apiFetch("metrics/")
            .then((data) => {
            setMetrics(data);
            setLoading(false);
        })
            .catch((err) => {
            setError(err.message);
            setLoading(false);
        });
    }, []);
    if (loading)
        return _jsx("p", { children: "Cargando m\u00E9tricas..." });
    if (error)
        return _jsxs("p", { children: ["Error: ", error] });
    return (_jsxs("div", { children: [_jsx("h1", { children: "Dashboard" }), _jsxs("ul", { children: [_jsxs("li", { children: ["Total de pacientes: ", metrics?.totalPatients] }), _jsxs("li", { children: ["Citas de hoy: ", metrics?.todayAppointments] }), _jsxs("li", { children: ["Pagos pendientes: ", metrics?.pendingPayments] })] })] }));
}
