// src/components/Layout/Sidebar.tsx
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Clock,
  Stethoscope,
  Scan,
  Scissors,
  Bed,
  Users,
  CalendarDays,
  CreditCard,
  BarChart2,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  Briefcase,
} from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (value: boolean) => void;
}

const navItems = [
  { path: "/doctor", label: "Dashboard", icon: LayoutDashboard },
  { path: "/waitingroom", label: "Sala de Espera", icon: Clock },
  { path: "/consultation", label: "Consulta", icon: Stethoscope },
  { path: "/diagnosis", label: "Diagnóstico", icon: Scan },
  { path: "/surgery", label: "Cirugía", icon: Scissors },
  { path: "/hospitalization", label: "Hospitalización", icon: Bed },
  { path: "/patients", label: "Pacientes", icon: Users },
  { path: "/appointments", label: "Citas", icon: CalendarDays },
  { path: "/payments", label: "Pagos", icon: CreditCard },
  { path: "/services", label: "Servicios", icon: Briefcase },
  { path: "/reports", label: "Reportes", icon: BarChart2 },
  { path: "/settings/config", label: "Configuración", icon: Settings },
];

export default function Sidebar({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}: SidebarProps) {
  const location = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const effectiveCollapsed = mobileOpen ? false : collapsed;

  useEffect(() => {
    const checkTheme = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Header - Desktop & Mobile share same layout, compact styling */}
      <div className={`
        flex items-center h-16 px-4 border-b border-white/10
        ${effectiveCollapsed ? "justify-center" : "justify-between"}
        ${mobileOpen ? "lg:justify-between" : ""}
      `}>
        {/* Logo Area */}
        <div className={`flex items-center justify-between w-full ${mobileOpen ? "flex-row" : ""}`}>
          <Link 
            to="/doctor" 
            className={`
              flex items-center gap-3 hover:opacity-100 
              ${location.pathname === "/doctor" ? "opacity-100" : "opacity-80 hover:opacity-100"}
            `}
          >
            <img
              src="/medopz_logo_blanco_solo.svg"
              alt="Logo"
              className="h-12 w-12 object-contain"
            />
            {!effectiveCollapsed && (
              <img
                src="/medopz_fuente_blanco.svg"
                alt="Medopz"
                className="h-4 w-auto object-contain"
              />
            )}
          </Link>
          {mobileOpen && (
            <button
              onClick={() => setMobileOpen(false)}
              className="p-2 text-white/50 hover:text-white transition-colors duration-200 ml-auto"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Collapse Button - Desktop only */}
        {!effectiveCollapsed && !mobileOpen && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 text-white/40 hover:text-white rounded-lg border border-transparent hover:border-white/15 hover:bg-white/5 transition-all duration-200"
          >
            <ChevronLeft size={18} />
          </button>
        )}
      </div>

      {/* Collapsed State Button */}
      {effectiveCollapsed && (
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="mx-auto mt-3 p-2.5 text-white/40 hover:text-white rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-200"
        >
          <ChevronRight size={18} />
        </button>
      )}

      {/* Nav Items */}
      <nav className="flex-1 min-h-0 overflow-y-auto px-2 py-2">
        <ul className={`flex flex-col ${effectiveCollapsed ? "pt-2" : ""} space-y-1`}>
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path;
            return (
              <li key={path}>
                <Link
                  to={path}
                  onClick={() => mobileOpen && setMobileOpen(false)}
                  className={`
                    group relative flex items-center
                    ${effectiveCollapsed ? "justify-center px-3 py-4" : "px-4 py-4"}
                    mb-0.5 overflow-hidden rounded-lg
                    transition-all duration-200
                    ${isActive 
                      ? "bg-white/10 text-white" 
                      : "text-white/70 hover:text-white hover:bg-emerald-500/10"
                    }
                  `}
                >
                  <Icon 
                    size={24} 
                    className={`shrink-0 ${isActive ? "text-emerald-400" : "text-white/80 group-hover:text-white"}`} 
                    strokeWidth={isActive ? 2 : 1.5} 
                  />
                  
                  {!effectiveCollapsed && (
                    <span 
                      className={`
                        ml-3 text-base font-semibold tracking-wide
                        overflow-hidden whitespace-nowrap
                        transition-all duration-200
                        ${isActive ? "text-white" : "text-white/80 group-hover:text-white"}
                      `}
                    >
                      {label}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      </div>
  );
}