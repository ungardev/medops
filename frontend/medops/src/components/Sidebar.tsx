import { Link, useLocation } from "react-router-dom";
import "./Sidebar.css";

const navItems = [
  { path: "/", label: "Dashboard" }, // ✅ ahora apunta a la raíz
  { path: "/appointments/today", label: "Sala de Espera" },
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

  return (
    <nav className="sidebar">
      <div className="brand">
        {/* ✅ Logo también apunta a la raíz */}
        <Link to="/">⚕️ MedOps</Link>
      </div>
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
  );
}
