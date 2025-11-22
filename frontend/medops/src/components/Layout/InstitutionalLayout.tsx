import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import InstitutionalHeader from "./InstitutionalHeader";
import InstitutionalFooter from "./InstitutionalFooter";
import { useState, useEffect } from "react";

export default function InstitutionalLayout() {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    if (saved === "true") setCollapsed(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", collapsed.toString());
  }, [collapsed]);

  const sidebarWidth = collapsed ? 80 : 256;

  return (
    <div className="min-h-screen xl:flex bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-x-hidden transition-colors">
      {/* 🔹 Sidebar fijo institucional */}
      <aside
        className="fixed top-0 left-0 h-screen z-50 transition-all duration-300"
        style={{ width: `${sidebarWidth}px` }}
      >
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      </aside>

      {/* 🔹 Contenido principal */}
      <div
        className="flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out"
        style={{ marginLeft: `${sidebarWidth}px` }}
      >
        {/* 🔹 Header sticky con fondo y borde institucional sólido */}
        <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-300">
          <InstitutionalHeader />
        </header>

        {/* 🔹 Área principal con scroll vertical */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
            <Outlet />
          </div>
        </main>

        {/* 🔹 Footer institucional */}
        <InstitutionalFooter />
      </div>
    </div>
  );
}
