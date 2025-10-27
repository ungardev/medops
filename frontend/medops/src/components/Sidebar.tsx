import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthToken } from "hooks/useAuthToken";

const navItems = [
  { path: "/", label: "Dashboard" },
  { path: "/waitingroom", label: "Sala de Espera" },
  { path: "/consultation", label: "Consulta" },
  { path: "/patients", label: "Pacientes" },
  { path: "/appointments", label: "Citas" },
  { path: "/payments", label: "Pagos" },
  { path: "/studies", label: "Estudios" },
  { path: "/reports", label: "Reportes" },
  { path: "/events", label: "Eventos" },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearToken } = useAuthToken();

  const handleLogout = () => {
    clearToken();       // 🔥 borra el token de localStorage
    navigate("/login"); // 🔥 redirige al login
  };

  return (
    <aside className="sidebar">
      <div className="brand">
        <Link to="/">MedOps</Link>
      </div>
      <nav>
        <ul>
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={location.pathname === item.path ? "active" : ""}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Botón de logout */}
      <div style={{ marginTop: "2rem", padding: "0 1rem" }}>
        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            padding: "8px 12px",
            background: "#dc2626",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
