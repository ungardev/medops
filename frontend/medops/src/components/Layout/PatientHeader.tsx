import { useNavigate } from "react-router-dom";
import { Menu, LogOut, Bell, User } from "lucide-react";
interface PatientHeaderProps {
  setCollapsed: (value: boolean) => void;
  setMobileOpen: (value: boolean) => void;
}
export default function PatientHeader({ setCollapsed, setMobileOpen }: PatientHeaderProps) {
  const navigate = useNavigate();
  
  // Obtener nombre del paciente desde localStorage
  const patientName = localStorage.getItem("patient_name") || "Paciente";
  
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
    // ✅ LIMPIAR TODOS LOS TOKENS DEL PACIENTE
    localStorage.removeItem("patient_access_token");
    localStorage.removeItem("patient_refresh_token");
    localStorage.removeItem("patient_drf_token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("patient_name");
    navigate("/patient/login");
  };
  return (
    <div className="flex items-center justify-between w-full px-4">
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
      {/* Right: User menu */}
      <div className="flex items-center gap-4">
        <button className="p-2 text-white/40 hover:text-white transition-colors relative">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full"></span>
        </button>
        
        {/* Nombre del paciente */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-sm border border-white/5">
          <User size={14} className="text-white/40" />
          <span className="text-[10px] font-medium text-white/80 uppercase">
            {patientName}
          </span>
        </div>
        
        <button
          onClick={handleLogout}
          className="p-2 text-white/40 hover:text-red-400 transition-colors"
          title="Cerrar Sesión"
        >
          <LogOut size={18} />
        </button>
      </div>
    </div>
  );
}