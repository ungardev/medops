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
        flex items-center h-14 px-3 border-b border-white/10
        ${effectiveCollapsed ? "justify-center" : "justify-between"}
        ${mobileOpen ? "lg:justify-between" : ""}
      `}>
        {/* Logo Area */}
        <div className={`flex items-center gap-2 ${mobileOpen ? "flex-row" : ""}`}>
          {mobileOpen && (
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1.5 -ml-2 text-white/40 hover:text-white transition-colors duration-200"
            >
              <X size={18} />
            </button>
          )}
          <Link 
            to="/doctor" 
            className={`
              flex items-center gap-2 hover:opacity-100 
              ${location.pathname === "/doctor" ? "opacity-100" : "opacity-70 hover:opacity-100"}
            `}
          >
            <img
              src="/medopz_logo_blanco_solo.svg"
              alt="Logo"
              className="h-8 w-8 object-contain"
            />
            {!effectiveCollapsed && (
              <img
                src="/medopz_fuente_blanco.svg"
                alt="Medopz"
                className="h-3.5 w-auto object-contain"
              />
            )}
          </Link>
        </div>

        {/* Collapse Button - Desktop only */}
        {!effectiveCollapsed && !mobileOpen && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 text-white/30 hover:text-white rounded-lg border border-transparent hover:border-white/10 hover:bg-white/5 transition-colors duration-200"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* Collapsed State Button */}
      {effectiveCollapsed && (
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="mx-auto mt-2 p-2 text-white/30 hover:text-white rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors duration-200"
        >
          <ChevronRight size={16} />
        </button>
      )}

      {/* Menu Label */}
      {!effectiveCollapsed && (
        <div className="flex items-center gap-2 px-3 mt-2 mb-1">
          <div className="h-[1px] w-4 bg-white/15"></div>
          <div className="text-[9px] font-medium text-white/40 uppercase tracking-wider">
            Menú
          </div>
        </div>
      )}

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto px-1">
        <ul className={`flex flex-col ${effectiveCollapsed ? "pt-2" : ""} space-y-0.5`}>
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path;
            return (
              <li key={path}>
                <Link
                  to={path}
                  onClick={() => mobileOpen && setMobileOpen(false)}
                  className={`
                    group relative flex items-center
                    ${effectiveCollapsed ? "justify-center px-3 py-3" : "px-3 py-3"}
                    mb-0.5 overflow-hidden rounded-lg
                    transition-colors duration-200
                    ${isActive 
                      ? "bg-white/10 text-white" 
                      : "text-white/60 hover:text-white hover:bg-white/5"
                    }
                  `}
                >
                  <Icon 
                    size={20} 
                    className={`shrink-0 ${isActive ? "text-white" : "group-hover:text-white/80"}`} 
                    strokeWidth={isActive ? 2 : 1.5} 
                  />
                  
                  {!effectiveCollapsed && (
                    <span 
                      className={`
                        ml-3 text-[13px] tracking-wide font-medium
                        overflow-hidden whitespace-nowrap
                        transition-opacity duration-200
                        ${isActive ? "text-white" : "text-white/60 group-hover:text-white/80"}
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

      {/* Footer - Doctor Indicator */}
      <div className="pt-3 border-t border-white/10">
        {effectiveCollapsed ? (
          <div className="flex justify-center py-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 pb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
            <span className="text-[9px] font-medium text-white/40 uppercase tracking-wider">Doctor</span>
          </div>
        )}
      </div>
    </div>
  );
}