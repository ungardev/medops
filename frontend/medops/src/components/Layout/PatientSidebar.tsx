// src/components/Layout/PatientSidebar.tsx
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Clock,
  Users,
  CalendarDays, 
  CreditCard,
  Briefcase,
  Settings,
  X,
  ChevronLeft,
  ChevronRight,
  Scissors,
  Bed
} from "lucide-react";
interface PatientSidebarProps {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (value: boolean) => void;
}
const navItems = [
  { path: "/patient", label: "Dashboard", icon: LayoutDashboard },
  { path: "/patient/queue", label: "Sala de Espera", icon: Clock },
  { path: "/patient/record", label: "Paciente", icon: Users },
  { path: "/patient/appointments", label: "Citas", icon: CalendarDays },
  { path: "/patient/payments", label: "Pagos", icon: CreditCard },
  { path: "/patient/services", label: "Servicios", icon: Briefcase },
  { path: "/patient/surgery", label: "Cirugía", icon: Scissors },
  { path: "/patient/hospitalization", label: "Hospitalización", icon: Bed },
  { path: "/patient/settings", label: "Configuración", icon: Settings },
];
export default function PatientSidebar({ 
  collapsed, 
  setCollapsed, 
  mobileOpen, 
  setMobileOpen 
}: PatientSidebarProps) {
  const location = useLocation();
  const effectiveCollapsed = mobileOpen ? false : collapsed;
  
  return (
    <div className="flex flex-col h-full pt-4 pb-6 px-3">
      <div className="flex flex-col mb-6">
        <div className={`flex relative ${
          mobileOpen 
          ? "flex-col items-center justify-center pt-2 pb-8" 
          : `items-center h-14 ${effectiveCollapsed ? "justify-center" : "justify-between px-2"}`
        }`}>
          
          {mobileOpen && (
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute -top-3 -right-1 p-2 text-white/20 hover:text-white/60 transition-colors"
            >
              <X size={24} />
            </button>
          )}
          
          <Link 
            to="/patient" 
            className={`flex items-center transition-all duration-300 hover:opacity-100 ${
              mobileOpen ? "flex-col gap-1" : "gap-3"
            } ${location.pathname === "/patient" ? "opacity-100" : "opacity-60 hover:opacity-90"}`}
          >
            <img
              src="/medopz_logo_blanco_solo.svg"
              alt="Logo"
              className={`transition-all duration-300 ${
                mobileOpen 
                ? "h-24 w-24" 
                : effectiveCollapsed ? "h-9 w-9" : "h-8 w-8"
              }`}
            />
            
            {!effectiveCollapsed && (
              <img
                src="/medopz_fuente_blanco.svg"
                alt="Medopz"
                className={`object-contain transition-all duration-300 ${
                  mobileOpen 
                  ? "h-[18px] w-auto -mt-1 -ml-1 opacity-80"
                  : "h-3.5 w-auto"
                }`}
              />
            )}
          </Link>
          
          {!effectiveCollapsed && !mobileOpen && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 text-white/20 hover:text-white/60 transition-all hidden lg:block rounded-lg hover:bg-white/5"
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </div>
        
        {effectiveCollapsed && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="mx-auto mt-2 p-2 text-white/20 hover:text-white/60 transition-all hidden lg:block rounded-lg hover:bg-white/5"
          >
            <ChevronRight size={16} />
          </button>
        )}
      </div>
      
      {!effectiveCollapsed && (
        <div className="flex items-center gap-2 mb-4 px-4">
          <div className="h-[1px] w-4 bg-white/10"></div>
          <div className="text-[9px] font-medium text-white/30 uppercase tracking-wider">
            Menú
          </div>
        </div>
      )}
      
      <nav className="flex-1">
        <ul className="flex flex-col space-y-0.5">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path;
            return (
              <li key={path}>
                <Link
                  to={path}
                  onClick={() => mobileOpen && setMobileOpen(false)}
                  className={`group relative flex items-center px-3 py-3 transition-all duration-200 mb-0.5 overflow-hidden rounded-lg ${
                    effectiveCollapsed ? "justify-center" : ""
                  } ${
                    isActive 
                      ? "bg-white/10 text-white" 
                      : "text-white/50 hover:text-white/70 hover:bg-white/5"
                  }`}
                >
                  <Icon 
                    size={20} 
                    className={`shrink-0 transition-all duration-200 ${
                      isActive ? "text-white" : "group-hover:text-white/70"
                    }`} 
                    strokeWidth={isActive ? 2 : 1.5} 
                  />
                  
                  {!effectiveCollapsed && (
                    <span className={`ml-3 text-[13px] tracking-wide font-medium ${
                      isActive ? "text-white" : "text-white/50 group-hover:text-white/70"
                    }`}>
                      {label}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="mt-auto pt-6 border-t border-white/10">
        {!effectiveCollapsed ? (
          <div className="flex items-center gap-2 px-4">
            <div className="w-1.5 h-1.5 rounded-full bg-white/40"></div>
            <span className="text-[8px] text-white/30 uppercase tracking-wider">Paciente</span>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-2 h-2 rounded-full bg-white/40"></div>
          </div>
        )}
      </div>
    </div>
  );
}