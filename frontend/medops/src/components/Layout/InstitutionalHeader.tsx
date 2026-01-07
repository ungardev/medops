// src/components/Layout/InstitutionalHeader.tsx
import {
  Bell, // 👈 Cambiado: Inbox por Bell
  UserCircle,
  Search,
  LogOut,
  Settings,
  Moon,
  Sun,
  FileText,
  DollarSign,
  UserCheck,
  Activity, // 👈 Nuevo: Para el icono por defecto de actividad
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/apiClient";
import { useAuthToken } from "hooks/useAuthToken";

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
  const day = Math.floor(hr / 24);
  if (day > 0) return `${day}d`;
  if (hr > 0) return `${hr}h`;
  if (min > 0) return `${min}m`;
  return "ahora";
}

function notificationIcon(n: Notification) {
  const { action } = n;
  if (action === "patient_arrived") return <UserCheck className="w-3.5 h-3.5" />;
  if (action === "payment_registered") return <DollarSign className="w-3.5 h-3.5" />;
  if (action === "report_generated") return <FileText className="w-3.5 h-3.5" />;
  return <Activity className="w-3.5 h-3.5" />; // 👈 Cambiado a Activity como fallback
}

export default function InstitutionalHeader({ setMobileOpen }: HeaderProps) {
  const navigate = useNavigate();
  const { clearToken } = useAuthToken();

  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [query, setQuery] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  
  const notifRef = useRef<HTMLDivElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

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
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = saved === "dark" || (!saved && prefersDark);
    document.documentElement.classList.toggle("dark", isDark);
    setDarkMode(isDark);
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
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    setDarkMode(next);
  };

  const handleLogout = () => {
    clearToken();
    navigate("/login");
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?query=${encodeURIComponent(query.trim())}`);
      setQuery("");
      searchInputRef.current?.blur();
    }
  };

  return (
    <div className="w-full flex items-center justify-between h-full bg-transparent px-4">
      {/* SECCIÓN BUSCADOR */}
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden p-2 text-[var(--palantir-muted)] hover:text-[var(--palantir-text)]"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--palantir-muted)] group-focus-within:text-[var(--palantir-active)] transition-colors" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Buscar paciente o comando... (Ctrl+K)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--palantir-bg)] border border-[var(--palantir-border)] rounded-md text-[13px] text-[var(--palantir-text)] focus:outline-none focus:border-[var(--palantir-active)]/50 transition-all placeholder:text-[var(--palantir-muted)]/50 font-mono"
          />
          <button type="submit" className="hidden" aria-hidden="true" />
        </form>
      </div>

      {/* SECCIÓN ACCIONES */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          title="Cambiar tema"
          className="p-2.5 text-[var(--palantir-muted)] hover:bg-[var(--palantir-border)] hover:text-[var(--palantir-text)] rounded-md transition-all"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notificaciones (Bell Icon) */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-2.5 rounded-md transition-all relative ${
              showNotifications 
                ? "bg-[var(--palantir-active)]/10 text-[var(--palantir-active)]" 
                : "text-[var(--palantir-muted)] hover:bg-[var(--palantir-border)] hover:text-[var(--palantir-text)]"
            }`}
          >
            <Bell size={18} /> {/* 👈 Aquí está tu "cartelito" de notificaciones */}
            {notifications.length > 0 && (
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-[var(--palantir-surface)] animate-pulse"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-[var(--palantir-surface)] border border-[var(--palantir-border)] rounded-md shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-3 border-b border-[var(--palantir-border)] bg-[var(--palantir-bg)] flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--palantir-muted)]">Log de Actividad</span>
                <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-[9px] text-emerald-500 px-1 py-0.5 font-bold">LIVE_FEED</span>
                </div>
              </div>
              
              <ul className="max-h-[380px] overflow-y-auto custom-scrollbar">
                {loadingNotifications ? (
                  <div className="p-8 text-center text-[11px] text-[var(--palantir-muted)] italic font-mono uppercase tracking-widest">Sincronizando...</div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center text-[11px] text-[var(--palantir-muted)] italic font-mono uppercase tracking-widest">Sin registros</div>
                ) : (
                  notifications.map((n) => (
                    <li key={n.id} className="border-b border-[var(--palantir-border)]/50 last:border-0 hover:bg-[var(--palantir-bg)] transition-colors p-3">
                      <div className="flex gap-3">
                        <div className="mt-0.5 text-[var(--palantir-active)] bg-[var(--palantir-active)]/10 p-1.5 rounded-md h-fit border border-[var(--palantir-active)]/20">
                          {notificationIcon(n)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-[11px] font-bold text-[var(--palantir-text)] uppercase tracking-tight truncate">
                              {n.actor}
                            </span>
                            <span className="text-[9px] text-[var(--palantir-muted)] font-mono whitespace-nowrap opacity-60">
                              [{formatRelative(n.timestamp)}]
                            </span>
                          </div>
                          <p className="text-[12px] text-[var(--palantir-muted)] leading-snug mt-0.5">
                            {n.action.replace(/_/g, ' ')}: <span className="italic text-white/60">{n.entity}</span>
                          </p>
                        </div>
                      </div>
                    </li>
                  ))
                )}
              </ul>
              <div className="p-2 border-t border-[var(--palantir-border)] bg-[var(--palantir-bg)]">
                <button className="w-full py-1.5 text-[10px] text-[var(--palantir-muted)] hover:text-[var(--palantir-active)] transition-colors uppercase font-bold tracking-tighter">
                  Acceder al Archivo de Logs
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-[1px] bg-[var(--palantir-border)] mx-2 opacity-50"></div>

        {/* Perfil de Usuario */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`flex items-center gap-3 p-1.5 px-3 rounded-md transition-all group ${
                menuOpen ? 'bg-[var(--palantir-border)]' : 'hover:bg-[var(--palantir-border)] shadow-sm'
            }`}
          >
            <div className="relative">
                <UserCircle size={22} className="text-[var(--palantir-muted)] group-hover:text-[var(--palantir-text)]" />
                <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border border-[var(--palantir-surface)]"></span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-[11px] font-bold text-[var(--palantir-text)] leading-none uppercase tracking-wider">ROOT_USER</p>
              <p className="text-[9px] text-[var(--palantir-muted)] leading-none mt-1 font-mono uppercase opacity-70">Sys.Admin</p>
            </div>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-3 w-52 bg-[var(--palantir-surface)] border border-[var(--palantir-border)] rounded-md shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="p-1.5">
                <button
                  onClick={() => { navigate("/settings/config"); setMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-[12px] text-[var(--palantir-text)] hover:bg-[var(--palantir-bg)] rounded-md transition-all font-medium"
                >
                  <Settings size={14} className="text-[var(--palantir-muted)]" /> Configuración
                </button>
                <div className="h-[1px] bg-[var(--palantir-border)] my-1 mx-2"></div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 text-[12px] text-red-400 hover:bg-red-400/10 rounded-md transition-all font-medium"
                >
                  <LogOut size={14} /> Finalizar Sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
