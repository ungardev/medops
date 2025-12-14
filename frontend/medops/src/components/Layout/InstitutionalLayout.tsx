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

  useEffect(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    if (saved === "true") setCollapsed(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", collapsed.toString());
  }, [collapsed]);

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => document.body.classList.remove("overflow-hidden");
  }, [mobileSidebarOpen]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-[#0d2c53] dark:text-white overflow-x-hidden">
      {/* 🔹 Overlay móvil y tablet */}
      <div
        className={`sm:block lg:hidden fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${
          mobileSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* 🔹 Layout principal */}
      <div className="relative min-h-screen flex flex-col lg:flex-row">
        {/* 🔹 Sidebar móvil y tablet flotante */}
        {mobileSidebarOpen && (
          <div className="sm:block lg:hidden fixed top-0 left-0 h-screen z-50 w-64">
            <Sidebar
              collapsed={false}
              setCollapsed={() => {}}
              mobileOpen={true}
              setMobileOpen={setMobileSidebarOpen}
            />
          </div>
        )}

        {/* 🔹 Sidebar desktop fijo */}
        <div
          className="hidden lg:block fixed top-0 left-0 h-screen z-50"
          style={{ width: collapsed ? "80px" : "256px", transition: "width 300ms ease-in-out" }}
        >
          <Sidebar
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            mobileOpen={false}
            setMobileOpen={setMobileSidebarOpen}
          />
        </div>

        {/* 🔹 Contenido desplazado solo en desktop */}
        <div
          className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
            collapsed ? "lg:ml-20" : "lg:ml-64"
          }`}
        >
          <InstitutionalHeader
            setCollapsed={setCollapsed}
            setMobileOpen={setMobileSidebarOpen}
          />
          <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 min-w-0">
              <Outlet />
            </div>
          </main>
          <InstitutionalFooter />
        </div>
      </div>

      {/* 🔹 Toaster institucional global */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontSize: "14px",
            borderRadius: "6px",
            padding: "10px 14px",
          },
          success: {
            style: {
              background: "#0d2c53",
              color: "white",
            },
          },
          error: {
            style: {
              background: "#b91c1c",
              color: "white",
            },
          },
        }}
      />
    </div>
  );
}
