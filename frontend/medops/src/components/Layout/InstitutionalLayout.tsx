import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import InstitutionalHeader from "./InstitutionalHeader";
import InstitutionalFooter from "./InstitutionalFooter";
import { useState, useEffect } from "react";

export default function InstitutionalLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    if (saved === "true") setCollapsed(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", collapsed.toString());
  }, [collapsed]);

  return (
    <div className="min-h-screen flex flex-row bg-gray-50 dark:bg-gray-900 text-[#0d2c53] dark:text-white transition-colors">
      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      {/* Content */}
      <div className="flex-1 flex flex-col transition-all duration-300 ease-in-out">
        {/* Header institucional */}
        <InstitutionalHeader
          setCollapsed={setCollapsed}
          setMobileOpen={setMobileSidebarOpen}
        />

        {/* Main */}
        <main className="flex-1 overflow-y-auto overflow-x-auto bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 min-w-0">
            <Outlet />
          </div>
        </main>

        {/* Footer */}
        <InstitutionalFooter />
      </div>
    </div>
  );
}
