// src/components/Layout/PatientHeader.tsx
import { useNavigate } from "react-router-dom";
import { Menu, LogOut, Bell, User, Settings, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
interface PatientHeaderProps {
  setCollapsed: (value: boolean) => void;
  setMobileOpen: (value: boolean) => void;
}
export default function PatientHeader({ setCollapsed, setMobileOpen }: PatientHeaderProps) {
  const navigate = useNavigate();
  
  const patientName = localStorage.getItem("patient_name") || "Paciente";
  
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  
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
  
  return (
    <div className="flex items-center justify-between w-full px-4 bg-black/40 border-b border-white/[0.05]">
      {/* Left: Menu button + Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden p-2 text-white/40 hover:text-white transition-colors"
        >
          <Menu size={20} />
        </button>
        
        <button
          onClick={() => setCollapsed(!false)}
          className="hidden lg:block p-2 text-white/20 hover:text-white transition-colors"
        >
          <Menu size={20} />
        </button>
        
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
            Patient Portal
          </span>
        </div>
      </div>
      
      {/* Right: User menu + notifications */}
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