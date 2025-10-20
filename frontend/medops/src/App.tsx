import { Outlet, Link, Routes, Route } from "react-router-dom";
import WaitingRoom from "./pages/WaitingRoom";

export default function App() {
    return (
        <div style={{ display: "flex", minHeight: "100vh" }}>
            {/* Sidebar / Navbar */}
            <nav
                style={{
                    width: "220px",
                    background: "#1e293b",
                    color: "#fff",
                    padding: "20px",
                }}
            >
                <h2>MedOps</h2>
                <ul style={{ listStyle: "none", padding: 0 }}>
                    <li>
                        <Link to="/" style={{ color: "#fff" }}>
                            Sala de Espera
                        </Link>
                    </li>
                    <li>
                        <Link to="/patients" style={{ color: "#fff" }}>
                            Pacientes
                        </Link>
                    </li>
                    <li>
                        <Link to="/appointments/today" style={{ color: "#fff" }}>
                            Citas de hoy
                        </Link>
                    </li>
                    <li>
                        <Link to="/payments/summary" style={{ color: "#fff" }}>
                            Pagos
                        </Link>
                    </li>
                    <li>
                        <Link to="/payments/waived" style={{ color: "#fff" }}>
                            Exoneradas
                        </Link>
                    </li>
                    <li>
                        <Link to="/events" style={{ color: "#fff" }}>
                            Eventos
                        </Link>
                    </li>
                    <li>
                        <Link to="/audit-dashboard" style={{ color: "#fff" }}>
                            Auditoría
                        </Link>
                    </li>
                </ul>
            </nav>

            {/* Contenido dinámico */}
            <main style={{ flex: 1, padding: "20px" }}>
                <Routes>
                    {/* Ruta raíz muestra la Sala de Espera */}
                    <Route path="/" element={<WaitingRoom />} />

                    {/* Outlet para las demás rutas */}
                    <Route path="/*" element={<Outlet />} />
                </Routes>
            </main>
        </div>
    );
}
