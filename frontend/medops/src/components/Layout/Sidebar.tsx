// src/components/Sidebar.tsx
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

  const itemBase = "group relative flex items-center px-4 py-3 transition-all duration-300 ease-out mb-1.5 overflow-hidden";
  const itemActive = "bg-white/[0.08] text-white shadow-[inset_0_0_12px_rgba(255,255,255,0.02)]";
  const itemIdle = "text-white/40 hover:text-white hover:bg-white/[0.04]";

  return (
    <aside
      className={`border-r border-white/5 transition-all duration-500 ease-in-out
        ${effectiveCollapsed ? "w-[78px]" : "w-64"}
        h-screen bg-[#0a0a0b] text-white
        flex-shrink-0 overflow-y-auto overflow-x-hidden flex flex-col z-50
      `}
    >
      <div className="flex flex-col h-full pt-4 pb-6 px-3">
        {/* LOGO AREA - ENCAJE QUIRÚRGICO */}
        <div className="flex flex-col mb-6">
            <div className={`flex relative ${
                mobileOpen 
                ? "flex-col items-center justify-center pt-2 pb-8" 
                : `items-center h-14 ${effectiveCollapsed ? "justify-center" : "justify-between px-2"}`
            }`}>
                
                {mobileOpen && (
                  <button
                    onClick={() => setMobileOpen(false)}
                    className="absolute -top-3 -right-1 p-2 text-white/20 hover:text-white transition-colors"
                  >
                    <X size={24} />
                  </button>
                )}

                <Link 
                  to="/" 
                  className={`flex items-center transition-all duration-500 hover:opacity-100 ${
                    mobileOpen ? "flex-col gap-1" : "gap-3"
                  } ${location.pathname === "/" ? "opacity-100" : "opacity-80 hover:opacity-100"}`}
                >
                    <img
                        src={getIconSrc()}
                        alt="Logo"
                        className={`transition-all duration-500 drop-shadow-[0_0_25px_rgba(255,255,255,0.18)] ${
                            mobileOpen 
                            ? "h-28 w-28" 
                            : effectiveCollapsed ? "h-10 w-10" : "h-9 w-9"
                        }`}
                    />
                    
                    {!effectiveCollapsed && (
                        <img
                            src={getFontSrc()}
                            alt="Medopz"
                            className={`object-contain transition-all duration-500 ${
                                mobileOpen 
                                ? "h-[22px] w-auto -mt-2 -ml-1 opacity-95" // Altura controlada y margen negativo para el encaje en D-O
                                : "h-4 w-auto"
                            }`}
                        />
                    )}
                </Link>

                {!effectiveCollapsed && !mobileOpen && (
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="p-1.5 text-white/20 hover:text-white transition-all hidden lg:block rounded-md border border-transparent hover:border-white/10 hover:bg-white/5"
                    >
                        <ChevronLeft size={16} />
                    </button>
                )}
            </div>

            {effectiveCollapsed && (
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="mx-auto mt-2 p-2 text-white/20 hover:text-white transition-all hidden lg:block rounded-md border border-white/5 bg-white/5 hover:bg-white/10"
                >
                    <ChevronRight size={16} />
                </button>
            )}
        </div>

        {/* SECTION LABEL */}
        {!effectiveCollapsed && (
          <div className="flex items-center gap-2 mb-4 px-4">
            <div className="h-[1px] w-4 bg-white/20"></div>
            <div className="text-[9px] font-black text-white/40 uppercase tracking-[0.4em]">
              Menu
            </div>
          </div>
        )}

        {/* NAVIGATION */}
        <nav className="flex-1">
          <ul className="flex flex-col space-y-1">
            {navItems.map(({ path, label, icon: Icon }) => {
              const isActive = location.pathname === path;
              return (
                <li key={path}>
                  <Link
                    to={path}
                    onClick={() => mobileOpen && setMobileOpen(false)}
                    className={`${itemBase} rounded-sm ${effectiveCollapsed ? "justify-center" : ""} ${isActive ? itemActive : itemIdle}`}
                  >
                    <Icon 
                      size={19} 
                      className={`shrink-0 transition-all duration-300 ${isActive ? "text-white" : "group-hover:text-white"}`} 
                      strokeWidth={isActive ? 2.5 : 1.5} 
                    />
                    
                    {!effectiveCollapsed && (
                      <span className={`ml-4 text-[13px] tracking-wide font-bold uppercase ${isActive ? "text-white" : "opacity-80 group-hover:opacity-100"}`}>
                        {label}
                      </span>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-white/[0.03] to-transparent translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* FOOTER */}
        <div className="mt-auto pt-6 border-t border-white/5">
            {!effectiveCollapsed ? (
              <div className="flex flex-col gap-2 px-4">
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse"></div>
                   <span className="text-[8px] font-mono text-white/40 uppercase tracking-[0.25em]">Medopz_Live_Link</span>
                </div>
              </div>
            ) : (
                <div className="flex justify-center">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></div>
                </div>
            )}
        </div>
      </div>
    </aside>
  );
}
