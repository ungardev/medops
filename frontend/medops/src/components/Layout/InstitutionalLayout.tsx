import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import InstitutionalHeader from "./InstitutionalHeader";
import InstitutionalFooter from "./InstitutionalFooter";
import { useState, useEffect } from "react";
import { Toaster } from "react-hot-toast";

export default function InstitutionalLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();

  // Persistencia del estado del sidebar
  useEffect(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    if (saved === "true") setCollapsed(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", collapsed.toString());
  }, [collapsed]);

  // Cerrar sidebar móvil al navegar
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  // Bloqueo de scroll en móvil
  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => document.body.classList.remove("overflow-hidden");
  }, [mobileSidebarOpen]);

  // Forzar redibujado de gráficos/tablas al colapsar
  useEffect(() => {
    // Pequeño delay para esperar a que termine la transición del sidebar
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 300);
    return () => clearTimeout(timer);
  }, [collapsed]);

  return (
    <div className="min-h-screen bg-[var(--palantir-bg)] text-[var(--palantir-text)] antialiased flex flex-col transition-colors duration-300">
      
      {/* 🔹 Overlay móvil: Usamos el fondo oscuro puro para el desenfoque */}
      <div
        className={`lg:hidden fixed inset-0 bg-[var(--palantir-bg)]/60 z-40 transition-opacity duration-300 backdrop-blur-md ${
          mobileSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileSidebarOpen(false)}
      />

      <div className="relative flex flex-1 overflow-hidden">
        
        {/* 🔹 Sidebar Container */}
        <aside
          className={`fixed top-0 left-0 h-screen z-50 transition-all duration-300 ease-in-out border-r border-[var(--palantir-border)] bg-[var(--palantir-surface)] ${
            mobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          } ${collapsed ? "w-[68px]" : "w-60"}`}
        >
          <Sidebar
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            mobileOpen={mobileSidebarOpen}
            setMobileOpen={setMobileSidebarOpen}
          />
        </aside>

        {/* 🔹 Área de Contenido Principal */}
        <div
          className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
            collapsed ? "lg:ml-[68px]" : "lg:ml-60"
          }`}
        >
          {/* 🔹 Header: Fondo de superficie, sin sombras pesadas, solo borde sutil */}
          <header className="h-16 border-b border-[var(--palantir-border)] bg-[var(--palantir-surface)] sticky top-0 z-30 flex items-center transition-colors duration-300">
            <InstitutionalHeader
              setCollapsed={setCollapsed}
              setMobileOpen={setMobileSidebarOpen}
            />
          </header>

          {/* 🔹 Main Content: El fondo aquí es var(--palantir-bg) para que las tarjetas resalten */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden relative custom-scrollbar">
            <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
              <Outlet />
            </div>
          </main>

          <InstitutionalFooter />
        </div>
      </div>

      {/* 🔹 Toaster: Unificado con el Azul MedOps y la paleta industrial */}
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'border-[var(--palantir-border)]',
          style: {
            background: "var(--palantir-surface)",
            color: "var(--palantir-text)",
            border: "1px solid var(--palantir-border)",
            borderRadius: "6px",
            fontSize: "12px",
            fontWeight: "500",
            boxShadow: "0 12px 24px -6px rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(12px)",
            padding: "12px 16px",
          },
          success: {
            iconTheme: {
              primary: "var(--palantir-active)",
              secondary: "var(--palantir-surface)",
            },
          },
          error: {
            style: {
              border: "1px solid #ff4b4b",
              background: "#1a1010",
              color: "#ff8a8a"
            },
          },
        }}
      />
    </div>
  );
}
