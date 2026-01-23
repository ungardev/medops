// src/components/Layout/Sidebar.tsx
import { useNavigate, useLocation } from "react-router-dom"; // ✅ FIX: Agregar useNavigate
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
  const navigate = useNavigate(); // ✅ FIX: Agregar useNavigate
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
        flex-shrink-0 overflow-y-auto overflow-x-hidden flex flex-col z-[300] // ✅ FIX: Z-index alto
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
                <button // ✅ FIX: Cambiar Link por button con navigate
                  onClick={() => navigate("/")}
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
                            : effectiveCollapsed ? "h-6 w-6" : "h-8 w-8"
                        }`}
                    />
                    {!effectiveCollapsed && !mobileOpen && (
                        <img
                            src={getFontSrc()}
                            alt="Fuente"
                            className="h-4 transition-all duration-500 drop-shadow-[0_0_25px_rgba(255,255,255,0.18)]"
                        />
                    )}
                </button>
                {!mobileOpen && (
                  <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-1.5 text-white/40 hover:text-white hover:bg-white/5 rounded-sm transition-all duration-300"
                  >
                    {effectiveCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                  </button>
                )}
            </div>
        </div>
        {/* NAVIGATION - FLUJO QUIRÚRGICO */}
        <nav className="flex-1">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <button // ✅ FIX: Cambiar Link por button con navigate
                    onClick={() => {
                      console.log('Sidebar navigation to:', item.path); // Log de diagnóstico
                      navigate(item.path);
                    }}
                    className={`${itemBase} ${isActive ? itemActive : itemIdle}`}
                  >
                    <Icon
                      size={20}
                      className={`flex-shrink-0 transition-all duration-300 ${
                        effectiveCollapsed && !mobileOpen ? "mx-auto" : ""
                      }`}
                    />
                    <span
                      className={`font-mono text-[10px] uppercase tracking-[0.15em] transition-all duration-300 ${
                        effectiveCollapsed && !mobileOpen ? "opacity-0 scale-0 w-0" : "opacity-100 scale-100"
                      }`}
                    >
                      {item.label}
                    </span>
                    {/* ACTIVE INDICATOR */}
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        {/* FOOTER - STATUS INDICATOR */}
        <div className="mt-auto pt-4 border-t border-white/5">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2 text-[8px] font-mono text-white/30 uppercase tracking-widest">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className={`transition-all duration-300 ${
                effectiveCollapsed && !mobileOpen ? "opacity-0 scale-0 w-0" : "opacity-100 scale-100"
              }`}>
                Online
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}