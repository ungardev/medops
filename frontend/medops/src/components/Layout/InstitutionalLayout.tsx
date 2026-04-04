// src/components/Layout/InstitutionalLayout.tsx
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
  
  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 300);
    return () => clearTimeout(timer);
  }, [collapsed]);
  return (
    <div className="min-h-screen bg-black text-white antialiased flex flex-col">
      
      <div
        className={`lg:hidden fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 backdrop-blur-md ${
          mobileSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileSidebarOpen(false)}
      />
      
      <div className="relative flex flex-1 overflow-hidden">
        
        <aside
          className={`fixed top-0 left-0 h-screen z-[300] transition-all duration-300 ease-in-out border-white/10 bg-[#0a0a0b] overflow-hidden
            ${mobileSidebarOpen 
              ? "translate-x-0 w-64 border-r" 
              : "-translate-x-full w-0 lg:w-auto lg:translate-x-0 lg:border-r"
            } 
            ${!mobileSidebarOpen && !collapsed ? "lg:w-64" : ""}
            ${!mobileSidebarOpen && collapsed ? "lg:w-[72px]" : ""}
          `}
        >
          <Sidebar
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            mobileOpen={mobileSidebarOpen}
            setMobileOpen={setMobileSidebarOpen}
          />
        </aside>
        
        <div
          className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
            collapsed ? "lg:ml-[72px]" : "lg:ml-64"
          }`}
        >
          <header className="h-14 border-b border-white/10 bg-black sticky top-0 z-30 flex items-center transition-colors duration-300">
            <InstitutionalHeader
              setCollapsed={setCollapsed}
              setMobileOpen={setMobileSidebarOpen}
            />
          </header>
          
          <main className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="max-w-[1600px] mx-auto p-4 sm:p-5 lg:p-6 animate-in fade-in duration-300">
              <Outlet />
            </div>
          </main>
          
          <InstitutionalFooter />
        </div>
      </div>
      
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'border border-white/15',
          style: {
            background: "#1a1a1b",
            color: "white",
            borderRadius: "12px",
            fontSize: "13px",
            fontWeight: "500",
            boxShadow: "0 12px 24px -6px rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(12px)",
            padding: "12px 16px",
          },
          success: {
            iconTheme: {
              primary: "#34d399",
              secondary: "#1a1a1b",
            },
          },
          error: {
            style: {
              border: "1px solid rgba(239, 68, 68, 0.3)",
              background: "rgba(239, 68, 68, 0.1)",
              color: "#fca5a5"
            },
          },
        }}
      />
    </div>
  );
}