// src/pages/Admin/AdminLayout.tsx
import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import AdminSidebar from "@/components/Admin/AdminSidebar";
import { Toaster } from "react-hot-toast";

export default function AdminLayout() {
  const { user } = useAuth();

  const isAdmin = user && user.is_superuser === true;
  if (!isAdmin) {
    return <Navigate to="/doctor" replace />;
  }

  return (
    <div className="min-h-screen bg-black text-white antialiased flex">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 h-screen w-64 border-r border-white/10 bg-[#0a0a0b] z-50">
        <AdminSidebar />
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        <main className="min-h-screen">
          <div className="max-w-[1400px] mx-auto p-6">
            <Outlet />
          </div>
        </main>
      </div>

      <Toaster
        position="top-right"
        toastOptions={{
          className: "border border-white/15",
          style: {
            background: "#1a1a1b",
            color: "white",
            borderRadius: "12px",
            fontSize: "13px",
          },
        }}
      />
    </div>
  );
}
