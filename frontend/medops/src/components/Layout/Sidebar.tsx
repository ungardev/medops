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

  // --- REFINAMIENTO DE ESTILOS PALANTIR ELITE ---
  const itemBase = "group flex items-center px-4 py-3 rounded-sm font-medium transition-all duration-200 ease-in-out mb-1";
  
  // Activo: Texto brillante con fondo sutil de la identidad
  const itemActive = "bg-[var(--palantir-active)]/20 text-white border-l-2 border-[var(--palantir-accent)] shadow-[inset_4px_0_10px_rgba(0,0,0,0.2)]";
  
  // Reposo: Texto blanco roto (no gris oscuro) para que se sienta disponible
  const itemIdle = "text-[#A0AEC0] hover:bg-[var(--palantir-border)]/40 hover:text-white";

  return (
    <aside
      className={`border-r border-[var(--palantir-border)] transition-all duration-300 ease-in-out
        ${effectiveCollapsed ? "w-[72px]" : "w-64"}
        h-screen bg-[var(--palantir-surface)] text-[var(--palantir-text)]
        flex-shrink-0 overflow-y-auto overflow-x-hidden flex flex-col
      `}
    >
      <div className="flex flex-col h-full pt-3 pb-4 px-2">
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
                            className={`object-contain opacity-95 transition-all ${
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
                    className="absolute top-4 right-4 p-2 text-[var(--palantir-muted)] hover:text-white"
                  >
                    <X size={22} />
                  </button>
                )}

                {!effectiveCollapsed && !mobileOpen && (
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="p-1.5 text-[var(--palantir-muted)] hover:text-white transition-colors hidden lg:block rounded-md hover:bg-[var(--palantir-border)]"
                    >
                        <ChevronLeft size={16} />
                    </button>
                )}
            </div>

            {effectiveCollapsed && (
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="mx-auto mt-2 p-1.5 text-[var(--palantir-muted)] hover:text-white transition-colors hidden lg:block rounded-md hover:bg-[var(--palantir-border)]"
                >
                    <ChevronRight size={16} />
                </button>
            )}

            {!effectiveCollapsed && (
              <div className="h-[1px] w-full bg-gradient-to-r from-[var(--palantir-border)] to-transparent mb-6 opacity-20" />
            )}
        </div>

        {!effectiveCollapsed && (
          <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-4 px-4">
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
                    <Icon size={20} className={`shrink-0 transition-colors ${isActive ? "text-[var(--palantir-accent)]" : "group-hover:text-white"}`} strokeWidth={isActive ? 2.5 : 2} />
                    {!effectiveCollapsed && (
                      <span className="ml-4 text-[14px] tracking-wide font-medium">
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
          <div className="mt-auto pt-4 border-t border-[var(--palantir-border)]/30 px-4">
            <div className="flex items-center gap-3">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
               <span className="text-[9px] font-mono text-white/40 uppercase tracking-[0.2em]">System_Online</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
