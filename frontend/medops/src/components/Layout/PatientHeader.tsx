// src/components/Layout/PatientHeader.tsx
import { useNavigate } from "react-router-dom";
import { LogOut, Bell, User, Settings, ChevronDown, Search, X, Menu } from "lucide-react";
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
    <div className="flex items-center justify-between w-full px-4 bg-black/40 border-b border-white/10">
      <div className="flex items-center gap-2 lg:gap-4 flex-1 min-w-0">
        
        <button 
          onClick={() => setMobileOpen(true)} 
          className="lg:hidden p-2 text-white/30 hover:text-white/60 transition-colors shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex-1 max-w-lg">
          <form onSubmit={handleSearchSubmit} className="relative w-full group flex items-center">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-white/20 group-focus-within:text-emerald-400/60 transition-colors" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Buscar doctores o servicios..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 bg-white/5 border border-white/15 rounded-lg text-[11px] text-white/80 placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>
        </div>
      </div>
      
      <div className="flex items-center gap-2 lg:gap-4 shrink-0">
        
        <button className="p-2 text-white/30 hover:text-white/60 transition-colors relative">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-400/60 rounded-full"></span>
        </button>
        
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 p-1.5 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all"
          >
            <div className="w-8 h-8 bg-emerald-500/10 rounded-full flex items-center justify-center shrink-0">
              <User size={14} className="text-emerald-400/70" />
            </div>
            <div className="hidden sm:block text-left">
              <span className="text-[10px] font-medium text-white/60">
                {patientName}
              </span>
            </div>
            <ChevronDown className={`w-3 h-3 text-white/30 transition-transform hidden sm:block ${menuOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-[#1a1a1b] border border-white/15 rounded-lg shadow-xl z-[60] overflow-hidden">
              <button 
                onClick={handleSettings}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-[11px] text-white/50 hover:text-white/80 hover:bg-white/5 transition-all"
              >
                <Settings className="w-4 h-4" />
                Configuración
              </button>
              <div className="h-[1px] bg-white/10 mx-2"></div>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-[11px] text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all"
              >
                <LogOut className="w-4 h-4" />
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}