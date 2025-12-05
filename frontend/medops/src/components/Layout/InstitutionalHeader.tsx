import { Bell, UserCircle, Search, LogOut, Settings, Moon, Sun } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import axios from "axios";

interface Notification {
  id: number;
  timestamp: string;
  actor: string;
  entity: string;
  entity_id: number;
  action: string;
  metadata: Record<string, any>;
  severity: string;
  notify: boolean;
}

interface HeaderProps {
  setCollapsed: (value: boolean) => void;
  setMobileOpen: (value: boolean) => void;
}

function formatNotification(n: Notification): string {
  const { action, entity, metadata } = n;
  if (action === "patient_arrived" && entity === "WaitingRoomEntry") return `Paciente llegó a la sala (ID ${metadata.patient_id})`;
  if (action === "payment_registered" && entity === "ChargeOrder") return `Pago registrado de $${metadata.amount} USD`;
  if (action === "generated" && entity === "MedicalReport") return `Informe médico generado (Código ${metadata.audit_code})`;
  if (action === "generate_pdf" && entity === "MedicalDocument") {
    const tipo = metadata.category?.replace(/_/g, " ") ?? "documento";
    return `PDF generado: ${tipo}`;
  }
  return `${action} en ${entity}`;
}

function getNotificationLink(n: Notification): string | undefined {
  const { entity, entity_id, metadata } = n;
  if (entity === "ChargeOrder") return `/charge-orders/${entity_id}`;
  if (entity === "WaitingRoomEntry") return `/waitingroom`;
  if (entity === "MedicalReport" || entity === "MedicalDocument") {
    const patientId = metadata?.patient_id;
    if (patientId) return `/patients/${patientId}?tab=documents`;
  }
  return undefined;
}

export default function InstitutionalHeader({ setCollapsed, setMobileOpen }: HeaderProps) {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [query, setQuery] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    setLoadingNotifications(true);
    axios
      .get<Notification[]>("/notifications/")
      .then((res) => {
        const raw = Array.isArray(res.data) ? res.data : [];
        setNotifications(raw.slice(0, 5));
      })
      .catch(() => setNotifications([]))
      .then(() => {
        setLoadingNotifications(false);
      });
  }, []);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
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

  const handleSearch = () => {
    const q = query.trim();
    if (q) {
      navigate(`/search?query=${encodeURIComponent(q)}`);
      setQuery(""); // 🔹 limpiar el input después de buscar
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

    return (
    <header className="sticky top-0 z-40 w-full h-16 flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="max-w-7xl mx-auto w-full h-16 flex items-center justify-between gap-4 px-4 sm:px-6 min-w-0">
        {/* Bloque izquierdo: hamburguesa + buscador */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-md text-gray-600 dark:text-gray-300 hover:text-[#0d2c53] dark:hover:text-white flex-shrink-0"
            aria-label="Abrir menú"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="relative w-full max-w-md min-w-0">
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-500 dark:text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full pl-10 pr-4 py-2 rounded-md text-sm bg-white dark:bg-gray-800 text-[#0d2c53] dark:text-white border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
            />
          </div>
        </div>

        {/* Bloque derecho: acciones */}
        <div className="flex items-center gap-1 flex-shrink-0 min-w-0">
          {/* Tema */}
          <button
            onClick={toggleTheme}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-gray-600 dark:text-gray-300 hover:text-[#0d2c53] dark:hover:text-white"
            aria-label="Cambiar tema"
          >
            {darkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </button>

          {/* Notificaciones */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications((v) => !v)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md text-gray-600 dark:text-gray-300 hover:text-[#0d2c53] dark:hover:text-white"
              aria-label="Notificaciones"
            >
              <Bell className="w-6 h-6" />
              {notifications.length > 0 && (
                <span className="absolute top-[2px] right-[2px] bg-[#0d2c53] text-white text-[10px] rounded-full px-1 leading-none">
                  {notifications.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50">
                <ul className="divide-y divide-gray-200 dark:divide-gray-700 max-h-64 overflow-y-auto">
                  {loadingNotifications ? (
                    <li className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Cargando…</li>
                  ) : notifications.length === 0 ? (
                    <li className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">No hay notificaciones.</li>
                  ) : (
                    notifications.map((n) => {
                      const label = formatNotification(n);
                      const link = getNotificationLink(n);
                      return (
                        <li
                          key={n.id}
                          className="px-4 py-2 text-sm text-[#0d2c53] dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                          onClick={() => {
                            if (link) navigate(link);
                            setShowNotifications(false);
                          }}
                        >
                          {label}
                        </li>
                      );
                    })
                  )}
                </ul>
              </div>
            )}
          </div>

          {/* Perfil */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md text-gray-600 dark:text-gray-300 hover:text-[#0d2c53] dark:hover:text-white"
              aria-label="Perfil"
            >
              <UserCircle className="w-6 h-6" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50">
                <button
                  onClick={() => navigate("/settings/config")}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#0d2c53] dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Settings className="w-4 h-4" />
                  Configuración
                </button>
                <button
                  onClick={() => navigate("/login")}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#0d2c53] dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
