// src/components/Admin/AdminSidebar.tsx
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Landmark,
  Users,
  Banknote,
  ChartBar,
  Building2,
  ArrowLeftIcon,
} from "lucide-react";

const navItems = [
  { path: "/admin", label: "Overview", icon: LayoutDashboard },
  { path: "/admin/bancaribe", label: "Bancaribe", icon: Landmark },
  { path: "/admin/doctors", label: "Doctores", icon: Users },
  { path: "/admin/disbursements", label: "Disbursements", icon: Banknote },
  { path: "/admin/earnings", label: "Earnings", icon: ChartBar },
  { path: "/admin/institutions", label: "Instituciones", icon: Building2 },
];

export default function AdminSidebar() {
  const location = useLocation();

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 h-14 border-b border-white/10">
        <Link to="/admin" className="flex items-center gap-2">
          <img
            src="/medopz_logo_blanco_solo.svg"
            alt="Logo"
            className="h-8 w-8 object-contain"
          />
          <div>
            <span className="text-sm font-semibold text-white">MEDOPZ</span>
            <span className="text-[10px] text-emerald-400 block -mt-1">Admin</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <item.icon className="w-4 h-4" />
              <span className="text-[12px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Back to Doctor Portal */}
      <div className="px-3 py-4 border-t border-white/10">
        <Link
          to="/doctor"
          className="flex items-center gap-3 px-3 py-2.5 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span className="text-[12px]">Volver al Portal</span>
        </Link>
      </div>
    </div>
  );
}
