// src/components/Layout/PatientHeader.tsx
import { useNavigate } from "react-router-dom";
import { LogOut, Bell, User, Settings, ChevronDown, Search, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
interface PatientHeaderProps {
  setCollapsed: (value: boolean) => void;
  setMobileOpen: (value: boolean) => void;
}
export default function PatientHeader({ setCollapsed, setMobileOpen }: PatientHeaderProps) {
  const navigate = useNavigate();
  
  const patientName = localStorage.getItem("patient_name") || "Paciente";
  
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const menuRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  
  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);
  // Atajo de teclado Ctrl + K para búsqueda
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
  
  const handleLogout = async () => {
    try {
      await fetch("/api/patient-auth/logout/", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("patient_access_token")}`,
        },
      });
    } catch (e) {
      console.error("Logout error:", e);
    }
    // LIMPIAR TODOS LOS TOKENS DEL PACIENTE
    localStorage.removeItem("patient_access_token");
    localStorage.removeItem("patient_refresh_token");
    localStorage.removeItem("patient_drf_token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("patient_name");
    navigate("/patient/login");
  };
  
  const handleSettings = () => {
    setMenuOpen(false);
    navigate("/patient/settings");
  };
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/patient/search?query=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      searchInputRef.current?.blur();
    }
  };
  
  return (
    <div className="flex items-center justify-between w-full px-4 bg-black/40 border-b border-white/[0.05]">
      {/* Left: Search Bar (ahora ocupa todo el espacio a la izquierda) */}
      <div className="flex items-center gap-4 flex-1">
        <div className="flex-1 max-w-lg">
          <form onSubmit={handleSearchSubmit} className="relative w-full group flex items-center">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-white/50 group-focus-within:text-emerald-400 transition-colors" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Buscar doctores o servicios... (Ctrl+K)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 bg-white/[0.04] border border-white/10 rounded-sm text-[11px] text-white placeholder-white/40 focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.06] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>
        </div>
      </div>
      
      {/* Right: User menu + notifications (sin cambios) */}
      <div className="flex items-center gap-4">
        <button className="p-2 text-white/40 hover:text-white transition-colors relative">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full"></span>
        </button>
        
        {/* User Menu with Dropdown */}
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-sm border border-white/5 hover:bg-white/10 transition-all"
          >
            <div className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center">
              <User size={14} className="text-emerald-400" />
            </div>
            <span className="text-[10px] font-medium text-white/80 uppercase">
              {patientName}
            </span>
            <ChevronDown className={`w-3 h-3 text-white/40 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-[#0a0a0b] border border-white/10 rounded-sm shadow-xl z-[60] overflow-hidden">
              <div className="px-3 py-2 bg-white/5 border-b border-white/10">
                <p className="text-[8px] font-mono text-white/40 uppercase">Patient_Access</p>
              </div>
              <button 
                onClick={handleSettings}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] text-white/60 hover:text-white hover:bg-white/5 transition-all font-medium"
              >
                <Settings className="w-3.5 h-3.5" />
                Settings
              </button>
              <div className="h-[1px] bg-white/10 mx-2"></div>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all font-medium"
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}