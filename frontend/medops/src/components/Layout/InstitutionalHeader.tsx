import { Bell, UserCircle, Search, LogOut, Settings, Moon, Sun } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export default function InstitutionalHeader() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      setDarkMode(true);
    }
  }, []);

  const toggleTheme = () => {
    if (darkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
    setDarkMode(!darkMode);
  };

  return (
    <header
      className="bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center justify-between shadow-sm transition-all duration-300"
    >
      {/* Branding */}
      <h1 className="text-blue-600 dark:text-blue-400 font-bold text-xl">MedOps</h1>

      {/* Search */}
      <div className="hidden md:flex flex-1 mx-6">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-500 dark:text-gray-400" />
          <input
            type="text"
            placeholder="Buscar..."
            className="w-full pl-10 pr-4 py-2 rounded-md text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-600
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-6 relative">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          {darkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
        </button>

        {/* Notifications */}
        <button className="relative text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          <Bell className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full px-1 animate-pulse">
            3
          </span>
        </button>

        {/* Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <UserCircle className="w-7 h-7" />
            <span className="hidden md:inline">Perfil</span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg animate-fade-slide z-50">
              <button
                onClick={() => navigate("/settings/config")}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Configuración
              </button>
              <button
                onClick={() => navigate("/login")}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
