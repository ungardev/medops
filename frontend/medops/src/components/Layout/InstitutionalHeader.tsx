// src/components/Layout/InstitutionalHeader.tsx
import {
  Bell,
  UserCircle,
  Search,
  LogOut,
  Settings,
  FileText,
  DollarSign,
  UserCheck,
  Activity,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/hooks/dashboard/useNotifications";
import { useDoctorConfig } from "@/hooks/settings/useDoctorConfig";
import moment from "moment";
interface HeaderProps {
  setCollapsed: (value: boolean) => void;
  setMobileOpen: (value: boolean) => void;
}
function notificationIcon(category: string) {
  if (category?.includes("appointment")) return <UserCheck className="w-4 h-4" />;
  if (category?.includes("payment")) return <DollarSign className="w-4 h-4" />;
  if (category?.includes("report")) return <FileText className="w-4 h-4" />;
  return <Activity className="w-4 h-4" />;
}
const getInitials = (fullName: string): string => {
  if (!fullName) return '??';
  const parts = fullName.trim().split(' ');
  const first = parts[0]?.charAt(0) || '';
  const last = parts[1]?.charAt(0) || '';
  return (first + last).toUpperCase();
};
const getGenderPrefix = (gender?: string): string => {
  return gender === 'F' ? 'Dra.' : 'Dr.';
};
const getPrimarySpecialty = (specialties?: any[]): string => {
  return specialties?.[0]?.name || 'Médico';
};
export default function InstitutionalHeader({ setMobileOpen }: HeaderProps) {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  
  const { data: rawData, isLoading } = useNotifications();
  const notifications = Array.isArray(rawData) ? rawData : (rawData as any)?.results || [];
  
  const { data: doctor, isLoading: doctorLoading } = useDoctorConfig();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const notifRef = useRef<HTMLDivElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  
  const handleNotificationClick = (n: any) => {
    if (n.action_href) {
      navigate(n.action_href);
      setShowNotifications(false);
    }
  };
  
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "light") {
        document.documentElement.classList.remove("dark");
        setDarkMode(false);
    } else {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
        setDarkMode(true);
    }
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
  
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (notifRef.current && !notifRef.current.contains(target)) setShowNotifications(false);
      if (userMenuRef.current && !userMenuRef.current.contains(target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?query=${encodeURIComponent(query.trim())}`);
      setQuery("");
      searchInputRef.current?.blur();
    }
  };
  
  const toggleTheme = () => {
    const next = !darkMode;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    setDarkMode(next);
  };
  
  const handleLogout = () => {
    logout();
  };
  
  return (
    <div className="w-full flex items-center justify-between h-full bg-white/5 px-4 lg:px-6 border-b border-white/10 relative z-[110]">
      <div className="flex items-center gap-3 lg:gap-6 flex-1 min-w-0">
        <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 text-white/60 hover:text-white transition-colors shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-lg group flex items-center min-w-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-white/40 group-focus-within:text-emerald-400 transition-colors hidden sm:flex" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Buscar paciente... (Ctrl+K)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 sm:pl-10 pr-10 lg:pr-24 py-2 bg-white/5 border border-white/15 rounded-lg text-[12px] text-white/80 focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all placeholder:text-white/30 min-w-0"
          />
          
          <button 
            type="submit"
            className="sm:hidden absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-white/50 hover:text-white"
          >
            <Search className="w-4 h-4" />
          </button>
          
          <div className="absolute inset-y-0 right-3 hidden lg:flex items-center">
            <span className="text-[9px] font-medium text-white/40 border border-white/10 px-2 py-0.5 rounded-md">Búsqueda Global</span>
          </div>
        </form>
      </div>
      
      <div className="flex items-center gap-2 lg:gap-3 shrink-0">
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)} 
            className={`p-2 rounded-lg transition-all border relative ${showNotifications ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400" : "text-white/60 hover:text-white border-transparent hover:bg-white/5"}`}
          >
            <Bell size={18} strokeWidth={2} />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
            )}
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-[#1a1a1b] border border-white/15 rounded-lg shadow-2xl z-[120] overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-3 bg-white/5 border-b border-white/15 flex justify-between items-center">
                <span className="text-[11px] font-semibold text-white">Notificaciones</span>
                <span className="text-[9px] text-emerald-400 font-medium px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
                  {notifications.length} nueva{notifications.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              <ul className="max-h-[350px] overflow-y-auto divide-y divide-white/5">
                {isLoading ? (
                  <li className="p-10 text-center text-[10px] text-white/40 animate-pulse">Cargando notificaciones...</li>
                ) : notifications.length === 0 ? (
                  <li className="p-10 text-center text-[10px] text-white/40">Sin notificaciones</li>
                ) : (
                  notifications.map((n: any) => (
                    <li 
                      key={n.id} 
                      onClick={() => handleNotificationClick(n)}
                      className="hover:bg-white/5 p-4 transition-colors group/item cursor-pointer"
                    >
                      <div className="flex gap-3">
                        <div className="mt-0.5 p-1.5 bg-white/5 rounded-md text-emerald-400 opacity-80 group-hover/item:opacity-100 transition-opacity">
                          {notificationIcon(n.category)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <span className="text-[11px] font-medium text-white/80 group-hover/item:text-emerald-400 transition-colors">{n.title}</span>
                            <span className="text-[9px] text-white/40 ml-2 shrink-0">{moment(n.timestamp).fromNow()}</span>
                          </div>
                          <p className="text-[10px] text-white/50 leading-relaxed mt-1 line-clamp-2">{n.description}</p>
                        </div>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>
        
        <div className="h-5 w-[1px] bg-white/10 mx-1 hidden sm:block"></div>
        
        <div className="relative" ref={userMenuRef}>
          <button onClick={() => setMenuOpen(!menuOpen)} className={`flex items-center gap-2 lg:gap-3 p-1.5 pl-2 pr-2 lg:pr-3 rounded-lg transition-all border ${menuOpen ? 'bg-white/5 border-white/20' : 'border-transparent hover:bg-white/5'}`}>
            <div className="relative">
              <div className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center border border-white/15">
                {doctorLoading ? (
                  <UserCircle size={20} className="text-white/60" />
                ) : (
                  <span className="text-[11px] font-semibold text-white">
                    {getInitials(doctor?.full_name || '')}
                  </span>
                )}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#0a0a0b]"></span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-[10px] font-semibold text-white">
                {getGenderPrefix(doctor?.gender)} {doctor?.full_name?.split(' ')[0] || 'Doctor'}
              </p>
              <p className="text-[9px] text-white/50">
                {getPrimarySpecialty(doctor?.specialties)}
              </p>
            </div>
          </button>
          
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-[#1a1a1b] border border-white/15 rounded-lg shadow-2xl z-[120] p-1.5 animate-in fade-in zoom-in-95">
              <button onClick={() => { navigate("/settings/config"); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-[11px] text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-all font-medium group">
                <Settings size={16} className="group-hover:rotate-45 transition-transform" /> Configuración
              </button>
              <div className="h-[1px] bg-white/10 my-1 mx-2"></div>
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 text-[11px] text-red-400/70 hover:bg-red-500/10 rounded-lg transition-all font-medium">
                <LogOut size={16} /> Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}