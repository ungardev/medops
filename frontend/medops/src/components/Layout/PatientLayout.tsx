// src/components/Layout/PatientLayout.tsx
import { Outlet, useLocation } from "react-router-dom";
import PatientSidebar from "./PatientSidebar";
import PatientHeader from "./PatientHeader";
import { useState, useEffect } from "react";
import { Toaster } from "react-hot-toast";
export default function PatientLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();
  // Persistencia del estado del sidebar
  useEffect(() => {
    const saved = localStorage.getItem("patientSidebarCollapsed");
    if (saved === "true") setCollapsed(true);
  }, []);
  useEffect(() => {
    localStorage.setItem("patientSidebarCollapsed", collapsed.toString());
  }, [collapsed]);
  // Cerrar sidebar móvil al navegar
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);
  return (
    <div className="min-h-screen bg-[#0a0c10] text-slate-200 antialiased flex flex-col transition-colors duration-300">
      {/* Overlay móvil */}
      <div
        className={`lg:hidden fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 backdrop-blur-md ${
          mobileSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileSidebarOpen(false)}
      />
      
      <div className="relative flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`fixed top-0 left-0 h-screen z-[300] transition-all duration-300 ease-in-out border-r border-white/5 bg-[#0a0a0b] overflow-hidden
            ${mobileSidebarOpen 
              ? "translate-x-0 w-64" 
              : "-translate-x-full w-0 lg:w-auto lg:translate-x-0 lg:border-r"
            } 
            ${!mobileSidebarOpen && !collapsed ? "lg:w-60" : ""}
            ${!mobileSidebarOpen && collapsed ? "lg:w-[78px]" : ""}
          `}
        >
          <PatientSidebar
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            mobileOpen={mobileSidebarOpen}
            setMobileOpen={setMobileSidebarOpen}
          />
        </aside>
        
        {/* Área de Contenido Principal */}
        <div
          className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
            collapsed ? "lg:ml-[78px]" : "lg:ml-60"
          }`}
        >
          {/* Header */}
          <header className="h-16 border-b border-white/5 bg-[#0a0a0b] sticky top-0 z-30 flex items-center transition-colors duration-300">
            <PatientHeader
              setCollapsed={setCollapsed}
              setMobileOpen={setMobileSidebarOpen}
            />
          </header>
          
          {/* Main Content */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
            <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
      
      {/* Toaster */}
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'border border-white/10',
          style: {
            background: "#0a0a0b",
            color: "#e2e8f0",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "6px",
            fontSize: "12px",
            fontWeight: "500",
            boxShadow: "0 12px 24px -6px rgba(0, 0, 0, 0.4)",
          },
          success: {
            iconTheme: {
              primary: "#10b981",
              secondary: "#0a0a0b",
            },
          },
          error: {
            style: {
              border: "1px solid #ef4444",
              background: "#0a0a0b",
              color: "#fca5a5"
            },
          },
        }}
      />
    </div>
  );
}