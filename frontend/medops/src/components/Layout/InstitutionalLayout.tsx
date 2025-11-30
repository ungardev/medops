import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import InstitutionalHeader from "./InstitutionalHeader";
import InstitutionalFooter from "./InstitutionalFooter";
import { useState, useEffect } from "react";

export default function InstitutionalLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();

  // 🔹 Restaurar estado colapsado desde localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    if (saved === "true") setCollapsed(true);
  }, []);

  // 🔹 Persistir estado colapsado en localStorage
  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", collapsed.toString());
  }, [collapsed]);

  // 🔹 Cerrar Sidebar móvil al cambiar de ruta
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  // 🔹 Bloquear scroll del body cuando Sidebar móvil está abierto
  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => document.body.classList.remove("overflow-hidden");
  }, [mobileSidebarOpen]);

  return (
    <div className="relative min-h-screen flex flex-col md:flex-row items-stretch bg-gray-50 dark:bg-gray-900 text-[#0d2c53] dark:text-white transition-colors">
      {/* 🔹 Overlay móvil separado del Sidebar */}
      {mobileSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* 🔹 Sidebar envuelto y blindado */}
      <div className="w-64 md:w-auto flex-shrink-0 z-50">
        <Sidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          mobileOpen={mobileSidebarOpen}
          setMobileOpen={setMobileSidebarOpen}
        />
      </div>

      {/* 🔹 Content */}
      <div className="flex-1 flex flex-col transition-all duration-300 ease-in-out">
        <InstitutionalHeader
          setCollapsed={setCollapsed}
          setMobileOpen={setMobileSidebarOpen}
        />

        <main className="flex-1 overflow-y-auto overflow-x-auto bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 min-w-0">
            <Outlet />
          </div>
        </main>

        <InstitutionalFooter />
      </div>
    </div>
  );
}
