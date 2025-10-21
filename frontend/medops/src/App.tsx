import { Outlet, Link } from "react-router-dom";

export default function App() {
  return (
    <div style={{ display: "flex", minHeight: "100vh", flexDirection: "column" }}>
      {/* Header */}
      <header
        style={{
          height: "60px",
          background: "#0f172a",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "1.2rem" }}>MedOps</h1>
        <div>Usuario</div>
      </header>

      {/* Body con sidebar + contenido */}
      <div style={{ display: "flex", flex: 1 }}>
        {/* Sidebar */}
        <nav
          style={{
            width: "220px",
            background: "#1e293b",
            color: "#fff",
            padding: "20px",
          }}
        >
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

        {/* Área dinámica */}
        <main style={{ flex: 1, padding: "20px", background: "#f8fafc" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
