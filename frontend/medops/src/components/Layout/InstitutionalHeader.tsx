// src/components/Layout/InstitutionalHeader.tsx
import {
  Bell,
  UserCircle,
  Search,
  LogOut,
  Settings,
  Moon,
  Sun,
  FileText,
  DollarSign,
  UserCheck,
  Activity,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useAuthToken } from "@/hooks/useAuthToken";
import { useNotifications } from "@/hooks/dashboard/useNotifications"; // Importamos el hook
import moment from "moment";

interface HeaderProps {
  setCollapsed: (value: boolean) => void;
  setMobileOpen: (value: boolean) => void;
}

// Helper para iconos basado en el sistema de auditoría
function notificationIcon(category: string) {
  if (category?.includes("appointment")) return <UserCheck className="w-3 h-3" />;
  if (category?.includes("payment")) return <DollarSign className="w-3 h-3" />;
  if (category?.includes("report")) return <FileText className="w-3 h-3" />;
  return <Activity className="w-3 h-3" />;
}

export default function InstitutionalHeader({ setMobileOpen }: HeaderProps) {
  const navigate = useNavigate();
  const { clearToken } = useAuthToken();
  
  // 🔹 Conectamos con el Stream de Datos
  const { data: rawData, isLoading } = useNotifications();
  const notifications = Array.isArray(rawData) ? rawData : (rawData as any)?.results || [];

  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  const notifRef = useRef<HTMLDivElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // ... (Efectos de tema, teclado y click outside se mantienen igual)
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
    clearToken();
    navigate("/login");
  };

  return (
    <div className="w-full flex items-center justify-between h-full bg-[#0c0e12] px-6 border-b border-white/[0.05] shadow-2xl relative z-[110]">
      <div className="flex items-center gap-6 flex-1">
        <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 text-white/40 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-lg group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-3.5 h-3.5 text-white/20 group-focus-within:text-[var(--palantir-active)] transition-colors" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="EJECUTAR COMANDO O BUSCAR_PACIENTE... (CTRL+K)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-white/[0.02] border border-white/10 rounded-sm text-[10px] text-white font-mono tracking-wider focus:outline-none focus:border-[var(--palantir-active)]/40 focus:bg-white/[0.04] transition-all placeholder:text-white/10"
          />
          <button type="submit" className="hidden" />
          <div className="absolute inset-y-0 right-3 flex items-center">
            <span className="text-[8px] font-black text-white/20 border border-white/5 px-1.5 py-0.5 rounded-sm uppercase tracking-tighter">Secure_Node</span>
          </div>
        </form>
      </div>

      <div className="flex items-center gap-3">
        {/* Notificaciones */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)} 
            className={`p-2 rounded-sm transition-all border relative ${showNotifications ? "bg-[var(--palantir-active)]/10 border-[var(--palantir-active)]/30 text-[var(--palantir-active)]" : "text-white/30 hover:text-white border-transparent hover:bg-white/5"}`}
          >
            <Bell size={15} strokeWidth={2.5} />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[var(--palantir-active)] rounded-full animate-pulse shadow-[0_0_8px_var(--palantir-active)]"></span>
            )}
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-[#0c0e12] border border-white/10 rounded-sm shadow-[0_20px_50px_rgba(0,0,0,1)] z-[120] overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-2 bg-white/[0.03] border-b border-white/5 flex justify-between items-center">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">Feed_Monitor</span>
                <span className="text-[7px] text-emerald-400 font-black px-1.5 py-0.5 bg-emerald-500/5 border border-emerald-500/20 rounded-sm tracking-tighter">UPLINK_LIVE</span>
              </div>
              
              <ul className="max-h-[350px] overflow-y-auto divide-y divide-white/[0.03] custom-scrollbar">
                {isLoading ? (
                  <li className="p-10 text-center text-[9px] font-mono text-white/10 uppercase animate-pulse">Synchronizing_Stream...</li>
                ) : notifications.length === 0 ? (
                  <li className="p-10 text-center text-[9px] font-mono text-white/10 uppercase">Empty_Log_Buffer</li>
                ) : (
                  notifications.map((n: any) => (
                    <li key={n.id} className="hover:bg-white/[0.02] p-4 transition-colors group/item cursor-pointer">
                      <div className="flex gap-3">
                        <div className="mt-0.5 p-1 bg-white/[0.03] rounded-sm text-[var(--palantir-active)] opacity-60 group-hover/item:opacity-100 transition-opacity">
                          {notificationIcon(n.category)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <span className="text-[10px] font-black text-white/80 uppercase tracking-tight group-hover/item:text-[var(--palantir-active)] transition-colors">{n.title}</span>
                            <span className="text-[8px] font-mono text-white/10">[{moment(n.timestamp).fromNow(true)}]</span>
                          </div>
                          <p className="text-[10px] text-white/30 leading-tight mt-1 line-clamp-2 italic">{n.description}</p>
                        </div>
                      </div>
                    </li>
                  ))
                )}
              </ul>
              <div className="p-2 border-t border-white/5 bg-white/[0.01] text-center">
                  <button className="text-[8px] font-black text-white/20 hover:text-white uppercase tracking-widest transition-colors">Clear_Buffer</button>
              </div>
            </div>
          )}
        </div>

        <div className="h-4 w-[1px] bg-white/10 mx-1"></div>

        {/* User Menu */}
        <div className="relative" ref={userMenuRef}>
          <button onClick={() => setMenuOpen(!menuOpen)} className={`flex items-center gap-3 p-1 pl-2 pr-3 rounded-sm transition-all border ${menuOpen ? 'bg-white/5 border-white/20' : 'border-transparent hover:bg-white/5'}`}>
            <div className="relative">
              <div className="w-7 h-7 bg-white/5 rounded-sm flex items-center justify-center border border-white/10">
                <UserCircle size={18} className="text-white/40" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#0c0e12] shadow-[0_0_5px_rgba(16,185,129,0.5)]"></span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-[9px] font-black text-white uppercase tracking-[0.15em]">ROOT_USER</p>
              <p className="text-[7px] text-[var(--palantir-active)] font-black uppercase tracking-tighter opacity-60">Admin_Lvl_01</p>
            </div>
          </button>
          
          {menuOpen && (
            <div className="absolute right-0 mt-3 w-52 bg-[#0c0e12] border border-white/10 rounded-sm shadow-[0_20px_50px_rgba(0,0,0,1)] z-[120] p-1.5 animate-in fade-in zoom-in-95">
              <div className="px-3 py-2 mb-1 border-b border-white/5">
                <p className="text-[7px] font-mono text-white/20 uppercase tracking-widest">Access_Node: 127.0.0.1</p>
              </div>
              <button onClick={() => { navigate("/settings/config"); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-[9px] text-white/50 hover:text-white hover:bg-white/5 rounded-sm transition-all font-black uppercase tracking-widest group">
                <Settings size={12} className="group-hover:rotate-45 transition-transform" /> Config_Sys
              </button>
              <div className="h-[1px] bg-white/5 my-1 mx-2"></div>
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-[9px] text-red-500/70 hover:bg-red-500/10 rounded-sm transition-all font-black uppercase tracking-widest">
                <LogOut size={12} /> Terminate_Session
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
