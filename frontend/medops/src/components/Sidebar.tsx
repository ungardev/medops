import { Link, useLocation } from "react-router-dom";

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
    </aside>
  );
}
