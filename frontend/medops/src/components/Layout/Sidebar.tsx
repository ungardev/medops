import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Clock,
  Stethoscope,
  Users,
  CalendarDays,
  CreditCard,
  BarChart2,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { useState } from "react";

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
}

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/waitingroom", label: "Sala de Espera", icon: Clock },
  { path: "/consultation", label: "Consulta", icon: Stethoscope },
  { path: "/patients", label: "Pacientes", icon: Users },
  { path: "/appointments", label: "Citas", icon: CalendarDays },
  { path: "/payments", label: "Pagos", icon: CreditCard },
  { path: "/reports", label: "Reportes", icon: BarChart2 },
  { path: "/settings/config", label: "Configuración", icon: Settings },
];

// Tooltip institucional estilizado
function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  return (
    <div
      className="relative flex items-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onTouchStart={() => setVisible(true)}
      onTouchEnd={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div className="absolute left-full ml-2 px-2 py-1 rounded-md bg-gray-800 text-white text-xs shadow-lg z-50 animate-fade-slide">
          {label}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const location = useLocation();

  const itemBase =
    "group flex items-center px-2 py-2 rounded-md font-medium transition-colors";
  const itemActive =
    "bg-gray-100 text-blue-600 border-l-4 border-blue-600 dark:bg-gray-800 dark:text-blue-400 dark:border-blue-400";
  const itemIdle =
    "text-gray-600 hover:bg-gray-100 hover:text-blue-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-blue-400";

  return (
    <>
      {/* Overlay en móviles */}
      <div
        className={`md:hidden fixed inset-0 bg-black bg-opacity-40 z-40 transition-opacity ${
          collapsed ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
        onClick={() => setCollapsed(true)}
      />

      {/* Sidebar institucional */}
      <aside
        className={`h-screen bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-700 flex flex-col p-4 shadow-sm z-50 transition-all duration-300
          ${collapsed ? "w-20" : "w-64"}
          fixed md:static top-0 left-0 md:translate-x-0
        `}
      >
        {/* Toggle (desktop) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="mb-6 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors self-end md:block hidden"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5 transition-transform duration-300" />
          ) : (
            <ChevronLeft className="w-5 h-5 transition-transform duration-300 rotate-180" />
          )}
        </button>

        {/* Cierre en móviles */}
        <button
          onClick={() => setCollapsed(true)}
          className="md:hidden self-end mb-4 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand institucional */}
        <div className={`text-xl font-bold mb-4 text-blue-600 dark:text-blue-400 ${collapsed ? "text-center" : ""}`}>
          <Link to="/">MedOps</Link>
        </div>

        {/* Label MENU */}
        {!collapsed && (
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4 px-2">
            MENU
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1">
          <ul className="flex flex-col gap-2">
            {navItems.map(({ path, label, icon: Icon }) => (
              <li key={path}>
                {collapsed ? (
                  <Tooltip label={label}>
                    <Link
                      to={path}
                      className={`${itemBase} ${
                        location.pathname === path ? itemActive : itemIdle
                      }`}
                    >
                      <div className="w-6 h-6 flex items-center justify-center">
                        <Icon className="w-5 h-5" />
                      </div>
                    </Link>
                  </Tooltip>
                ) : (
                  <Link
                    to={path}
                    className={`${itemBase} ${
                      location.pathname === path ? itemActive : itemIdle
                    }`}
                  >
                    <div className="w-6 h-6 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="ml-3 transition-all duration-300 origin-left">
                      {label}
                    </span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}
