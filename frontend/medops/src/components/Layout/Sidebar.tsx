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
  mobileOpen: boolean;
  setMobileOpen: (value: boolean) => void;
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
        <div className="absolute left-full ml-2 px-2 py-1 rounded-md bg-black text-white text-xs shadow-lg z-50">
          {label}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}: SidebarProps) {
  const location = useLocation();
  const effectiveCollapsed = mobileOpen ? false : collapsed;

  const itemBase =
    "group flex items-center px-2 py-2 rounded-md font-medium transition-colors";
  const itemActive =
    "bg-gray-100 text-[#0d2c53] dark:bg-gray-800 dark:text-white";
  const itemIdle =
    "text-gray-600 hover:bg-gray-100 hover:text-[#0d2c53] dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white";

  return (
    <aside
      className={`border-r border-gray-200 dark:border-gray-700 shadow-sm
        ${effectiveCollapsed ? "w-20" : "w-64"}
        h-screen bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200
        flex-shrink-0 overflow-y-auto overflow-x-hidden
      `}
      style={{ transition: "width 300ms ease-in-out" }}
    >
      <div className="flex flex-col justify-between h-full pt-2 pb-4 px-4">
        {/* Toggle (desktop) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="mb-3 text-gray-500 dark:text-gray-400 hover:text-[#0d2c53] dark:hover:text-white transition-colors self-end hidden md:block"
        >
          {effectiveCollapsed ? (
            <ChevronRight className="w-5 h-5 transition-transform duration-300" />
          ) : (
            <ChevronLeft className="w-5 h-5 transition-transform duration-300 rotate-180" />
          )}
        </button>

        {/* Cierre en móviles */}
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden self-end mb-2 text-gray-500 dark:text-gray-400 hover:text-[#0d2c53] dark:hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Branding institucional */}
        <Link
          to="/"
          className={`mb-4 flex justify-center items-center overflow-hidden ${effectiveCollapsed ? "h-20" : "h-16"}`}
        >
          {!effectiveCollapsed ? (
            <>
              <img
                src="/logo-medops-light.svg"
                alt="MedOps"
                className="max-h-14 w-auto block dark:hidden"
              />
              <img
                src="/logo-medops-dark.svg"
                alt="MedOps"
                className="max-h-14 w-auto hidden dark:block"
              />
            </>
          ) : (
            <>
              <img
                src="/logo-icon-light.svg"
                alt="MedOps"
                className="max-h-14 w-auto block dark:hidden"
              />
              <img
                src="/logo-icon-dark.svg"
                alt="MedOps"
                className="max-h-14 w-auto hidden dark:block"
              />
            </>
          )}
        </Link>

        {/* Label MENU */}
        {!effectiveCollapsed && (
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4 px-2">
            MENU
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden">
          <ul className="flex flex-col gap-2">
            {navItems.map(({ path, label, icon: Icon }) => (
              <li key={path}>
                {effectiveCollapsed ? (
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
      </div>
    </aside>
  );
}
