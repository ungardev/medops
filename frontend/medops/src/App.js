import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Outlet, Link } from "react-router-dom";
export default function App() {
    return (_jsxs("div", { style: { display: "flex", minHeight: "100vh" }, children: [_jsxs("nav", { style: {
                    width: "220px",
                    background: "#1e293b",
                    color: "#fff",
                    padding: "20px"
                }, children: [_jsx("h2", { children: "MedOps" }), _jsxs("ul", { style: { listStyle: "none", padding: 0 }, children: [_jsx("li", { children: _jsx(Link, { to: "/", style: { color: "#fff" }, children: "Dashboard" }) }), _jsx("li", { children: _jsx(Link, { to: "/patients", style: { color: "#fff" }, children: "Pacientes" }) }), _jsx("li", { children: _jsx(Link, { to: "/appointments/today", style: { color: "#fff" }, children: "Citas de hoy" }) }), _jsx("li", { children: _jsx(Link, { to: "/payments/summary", style: { color: "#fff" }, children: "Pagos" }) }), _jsx("li", { children: _jsx(Link, { to: "/payments/waived", style: { color: "#fff" }, children: "Exoneradas" }) }), _jsx("li", { children: _jsx(Link, { to: "/events", style: { color: "#fff" }, children: "Eventos" }) }), _jsx("li", { children: _jsx(Link, { to: "/audit-dashboard", style: { color: "#fff" }, children: "Auditor\u00EDa" }) })] })] }), _jsx("main", { style: { flex: 1, padding: "20px" }, children: _jsx(Outlet, {}) })] }));
}
