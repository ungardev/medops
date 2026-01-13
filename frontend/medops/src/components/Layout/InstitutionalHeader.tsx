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
import { api } from "@/lib/apiClient";
import { useAuthToken } from "@/hooks/useAuthToken";

interface Notification {
  id: number;
  timestamp: string;
  actor: string;
  entity: string;
  entity_id: number;
  action: string;
  metadata: Record<string, any>;
  severity: "info" | "success" | "warning" | "error" | string;
  notify: boolean;
}

interface HeaderProps {
  setCollapsed: (value: boolean) => void;
  setMobileOpen: (value: boolean) => void;
}

function formatRelative(ts: string): string {
  const d = new Date(ts);
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  const hr = Math.floor(min / 60);
  if (hr > 0) return `${hr}h`;
  if (min > 0) return `${min}m`;
  return "now";
}

function notificationIcon(n: Notification) {
  const { action } = n;
  if (action === "patient_arrived") return <UserCheck className="w-3.5 h-3.5" />;
  if (action === "payment_registered") return <DollarSign className="w-3.5 h-3.5" />;
  if (action === "report_generated") return <FileText className="w-3.5 h-3.5" />;
  return <Activity className="w-3.5 h-3.5" />;
}

export default function InstitutionalHeader({ setMobileOpen }: HeaderProps) {
  const navigate = useNavigate();
  const { clearToken } = useAuthToken();

  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  
  // Forzamos Dark Mode por defecto en el estado inicial
  const [darkMode, setDarkMode] = useState(true);

  const notifRef = useRef<HTMLDivElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // EFECTO CRÍTICO: Asegurar Dark Mode al montar
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "light") {
        document.documentElement.classList.remove("dark");
        setDarkMode(false);
    } else {
        // Por defecto o si es 'dark', inyectamos la clase
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
    const fetchNotifications = async () => {
      setLoadingNotifications(true);
      try {
        const res = await api.get<Notification[]>("/notifications/");
        setNotifications(Array.isArray(res.data) ? res.data.slice(0, 8) : []);
      } catch {
        setNotifications([]);
      } finally {
        setLoadingNotifications(false);
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
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

  const toggleTheme = () => {
    const next = !darkMode;
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
    setDarkMode(next);
  };

  const handleLogout = () => {
    clearToken();
    navigate("/login");
  };

  return (
    <div className="w-full flex items-center justify-between h-full bg-[#0c0e12] px-6 border-b border-white/[0.05] shadow-2xl">
      {/* SECCIÓN BUSCADOR */}
      <div className="flex items-center gap-6 flex-1">
        <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 text-white/40 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="relative w-full max-w-lg group">
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
          <div className="absolute inset-y-0 right-3 flex items-center">
            <span className="text-[8px] font-black text-white/20 border border-white/5 px-1.5 py-0.5 rounded-sm uppercase tracking-tighter">Secure_Node</span>
          </div>
        </div>
      </div>

      {/* SECCIÓN ACCIONES */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleTheme}
          className="p-2 text-white/30 hover:text-[var(--palantir-active)] hover:bg-white/5 rounded-sm transition-all border border-transparent"
        >
          {darkMode ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Notificaciones */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-2 rounded-sm transition-all border ${
              showNotifications 
                ? "bg-[var(--palantir-active)]/10 border-[var(--palantir-active)]/30 text-[var(--palantir-active)]" 
                : "text-white/30 hover:text-white border-transparent hover:bg-white/5"
            }`}
          >
            <Bell size={15} strokeWidth={2.5} />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(239,68,68,1)]"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-[#0c0e12] border border-white/10 rounded-sm shadow-[0_20px_50px_rgba(0,0,0,1)] z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-2.5 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">Feed_Monitor</span>
                <span className="text-[8px] text-emerald-400 font-black px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-sm">LIVE</span>
              </div>
              <ul className="max-h-[300px] overflow-y-auto divide-y divide-white/[0.03]">
                {notifications.map((n) => (
                  <li key={n.id} className="hover:bg-white/[0.02] p-3.5 transition-colors">
                    <div className="flex gap-3">
                      <div className="mt-0.5 text-[var(--palantir-active)] opacity-80">{notificationIcon(n)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-bold text-white uppercase tracking-tight">{n.actor}</span>
                          <span className="text-[8px] font-mono text-white/20">[{formatRelative(n.timestamp)}]</span>
                        </div>
                        <p className="text-[10px] text-white/40 leading-tight mt-0.5">
                          {n.action.replace(/_/g, ' ')} → <span className="text-white/70 italic">{n.entity}</span>
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="h-4 w-[1px] bg-white/5 mx-1"></div>

        {/* Perfil */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`flex items-center gap-3 p-1 pl-2 pr-3 rounded-sm transition-all border ${
                menuOpen ? 'bg-white/5 border-white/20' : 'border-transparent hover:bg-white/5'
            }`}
          >
            <div className="relative">
                <div className="w-6 h-6 bg-white/5 rounded-sm flex items-center justify-center border border-white/10 transition-all">
                   <UserCircle size={16} className="text-white/40" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border-2 border-[#0c0e12]"></span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-[9px] font-black text-white uppercase tracking-widest">ROOT_USER</p>
              <p className="text-[7px] text-[var(--palantir-active)] font-black uppercase tracking-tighter opacity-60">Admin_Lvl_01</p>
            </div>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-3 w-48 bg-[#0c0e12] border border-white/10 rounded-sm shadow-[0_20px_50px_rgba(0,0,0,1)] z-[100] p-1.5 animate-in fade-in zoom-in-95">
              <button onClick={() => { navigate("/settings/config"); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-[9px] text-white/50 hover:text-white hover:bg-white/5 rounded-sm transition-all font-black uppercase tracking-widest">
                <Settings size={12} /> Config_Sys
              </button>
              <div className="h-[1px] bg-white/5 my-1 mx-2"></div>
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-[9px] text-red-500/70 hover:bg-red-500/10 rounded-sm transition-all font-black uppercase tracking-widest">
                <LogOut size={12} /> Terminate
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
