import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
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

  const getIconSrc = () => isDarkMode ? "/medopz_logo_blanco_solo.svg" : "/medopz_logo_negro_solo.svg";
  const getFontSrc = () => isDarkMode ? "/medopz_fuente_blanco.svg" : "/medopz_fuente_negro.svg";

  // Item base con padding ajustado para los iconos más grandes
  const itemBase = "group flex items-center px-3 py-3 rounded-md font-medium transition-all duration-200 ease-in-out mb-1.5";
  const itemActive = "bg-[var(--palantir-active)]/10 text-[var(--palantir-active)] shadow-sm ring-1 ring-[var(--palantir-active)]/20";
  const itemIdle = "text-[var(--palantir-muted)] hover:bg-[var(--palantir-border)] hover:text-[var(--palantir-text)]";

  return (
    <aside
      className={`border-r border-[var(--palantir-border)] transition-all duration-300 ease-in-out
        ${effectiveCollapsed ? "w-[72px]" : "w-64"}
        h-screen bg-[var(--palantir-surface)] text-[var(--palantir-text)]
        flex-shrink-0 overflow-y-auto overflow-x-hidden flex flex-col
      `}
    >
      <div className="flex flex-col h-full pt-3 pb-4 px-3">
        <div className="flex flex-col mb-4">
            <div className={`flex mb-2 ${
                mobileOpen 
                ? "flex-col items-center justify-center pt-8 pb-4" 
                : `items-center h-14 ${effectiveCollapsed ? "justify-center" : "justify-between px-2"}`
            }`}>
                
                <Link 
                  to="/" 
                  className={`flex transition-all duration-300 ${
                    mobileOpen ? "flex-col items-center gap-4" : "items-center gap-2"
                  }`}
                >
                    <img
                        src={getIconSrc()}
                        alt="Logo"
                        className={`transition-all duration-300 object-contain ${
                            mobileOpen 
                            ? "h-20 w-20" 
                            : effectiveCollapsed ? "h-10 w-10" : "h-9 w-9"
                        }`}
                    />
                    
                    {!effectiveCollapsed && (
                        <img
                            src={getFontSrc()}
                            alt="Medopz"
                            className={`object-contain opacity-80 transition-all ${
                                mobileOpen 
                                ? "h-5 w-auto" 
                                : "h-3.5 w-auto"
                            }`}
                        />
                    )}
                </Link>

                {mobileOpen && (
                  <button
                    onClick={() => setMobileOpen(false)}
                    className="absolute top-4 right-4 p-2 text-[var(--palantir-muted)] hover:text-[var(--palantir-text)]"
                  >
                    <X size={22} />
                  </button>
                )}

                {!effectiveCollapsed && !mobileOpen && (
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="p-1.5 text-[var(--palantir-muted)] hover:text-[var(--palantir-text)] transition-colors hidden lg:block rounded-md hover:bg-[var(--palantir-border)]"
                    >
                        <ChevronLeft size={16} />
                    </button>
                )}
            </div>

            {effectiveCollapsed && (
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="mx-auto mt-2 p-1.5 text-[var(--palantir-muted)] hover:text-[var(--palantir-text)] transition-colors hidden lg:block rounded-md hover:bg-[var(--palantir-border)]"
                >
                    <ChevronRight size={16} />
                </button>
            )}

            {!effectiveCollapsed && (
              <div className="h-[1px] w-full bg-gradient-to-r from-[var(--palantir-border)] to-transparent mb-6 opacity-30" />
            )}
        </div>

        {!effectiveCollapsed && (
          <div className="text-[11px] font-bold text-[var(--palantir-muted)] uppercase tracking-[0.2em] mb-4 px-3 opacity-40">
            Navegación
          </div>
        )}

        <nav className="flex-1">
          <ul className="flex flex-col">
            {navItems.map(({ path, label, icon: Icon }) => {
              const isActive = location.pathname === path;
              return (
                <li key={path}>
                  <Link
                    to={path}
                    onClick={() => mobileOpen && setMobileOpen(false)}
                    title={effectiveCollapsed ? label : ""}
                    className={`${itemBase} ${effectiveCollapsed ? "justify-center" : ""} ${isActive ? itemActive : itemIdle}`}
                  >
                    {/* Iconos ahora son siempre tamaño 24 para máxima consistencia */}
                    <Icon size={24} className="shrink-0" strokeWidth={isActive ? 2 : 1.5} />
                    {!effectiveCollapsed && (
                      <span className="ml-4 text-[15px] tracking-tight font-semibold">
                        {label}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {!effectiveCollapsed && (
          <div className="mt-auto pt-4 border-t border-[var(--palantir-border)] px-3">
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
               <span className="text-[9px] font-mono text-[var(--palantir-muted)] uppercase tracking-[0.15em]">System_Online</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
