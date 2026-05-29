// src/pages/Admin/AdminOverview.tsx
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";
import {
  UsersIcon,
  BanknotesIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  ArrowTrendingUpIcon,
  ArrowDownTrayIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { useAdminAuth } from "@/context/AdminAuthContext";

interface OverviewStats {
  total_doctors: number;
  total_institutions: number;
  month_gross: string;
  month_commission: string;
  today_disbursements_count: number;
  today_disbursements_amount: string;
  pending_disbursements_count: number;
  pending_disbursements_amount: string;
}

interface ActivityItem {
  type: "disbursement" | "earnings";
  id: number;
  description: string;
  status: string;
  amount: string;
  timestamp: string;
}

interface OverviewData {
  stats: OverviewStats;
  recent_activity: ActivityItem[];
}

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Ahora";
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  return `Hace ${diffDays}d`;
}

function formatCurrency(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "$0.00";
  return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function AdminOverview() {
  const { user } = useAdminAuth();

  const { data, isLoading, error } = useQuery<OverviewData>({
    queryKey: ["admin-overview"],
    queryFn: () => apiFetch<OverviewData>("admin/overview/"),
  });

  const stats = data?.stats;
  const recentActivity = data?.recent_activity || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-white">Admin Overview</h1>
          <p className="text-sm text-white/40">Resumen de la plataforma MEDOPZ</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5 animate-pulse">
              <div className="h-4 w-24 bg-white/10 rounded mb-3"></div>
              <div className="h-8 w-16 bg-white/10 rounded"></div>
            </div>
          ))}
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="h-4 w-32 bg-white/10 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-white/10 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-white">Admin Overview</h1>
          <p className="text-sm text-red-400">Error cargando datos: {String(error)}</p>
        </div>
      </div>
    );
  }

  const statsData = [
    {
      label: "Doctores Activos",
      value: stats?.total_doctors ?? 0,
      icon: UsersIcon,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Instituciones",
      value: stats?.total_institutions ?? 0,
      icon: BuildingOfficeIcon,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
    },
    {
      label: "Ingresos Mes",
      value: formatCurrency(stats?.month_gross ?? "0"),
      icon: ChartBarIcon,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
    },
    {
      label: "Comisión Mes",
      value: formatCurrency(stats?.month_commission ?? "0"),
      icon: BanknotesIcon,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Admin Overview</h1>
          <p className="text-sm text-white/40">Resumen de la plataforma MEDOPZ</p>
        </div>
        {user && (
          <div className="text-right">
            <p className="text-xs text-white/60">{user.username}</p>
            <p className="text-[10px] text-emerald-400 uppercase tracking-wider">Admin</p>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsData.map((stat) => (
          <div
            key={stat.label}
            className={`${stat.bgColor} border border-white/10 rounded-xl p-5`}
          >
            <div className="flex items-center gap-2 mb-3">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <span className="text-[10px] font-medium uppercase tracking-wider text-white/40">
                {stat.label}
              </span>
            </div>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Disbursements Today */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <ArrowDownTrayIcon className="w-4 h-4 text-emerald-400" />
            Disbursements Hoy
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[12px] text-white/60">Transactions</span>
              <span className="text-lg font-bold text-white">{stats?.today_disbursements_count ?? 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[12px] text-white/60">Monto Total</span>
              <span className="text-lg font-bold text-emerald-400">{formatCurrency(stats?.today_disbursements_amount ?? "0")}</span>
            </div>
            <div className="border-t border-white/10 pt-3 mt-3">
              <div className="flex justify-between items-center">
                <span className="text-[12px] text-white/60">Pendientes</span>
                <span className="text-lg font-bold text-amber-400">{stats?.pending_disbursements_count ?? 0}</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-[10px] text-white/40">Monto Pendiente</span>
                <span className="text-sm font-medium text-amber-400/70">{formatCurrency(stats?.pending_disbursements_amount ?? "0")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <ClockIcon className="w-4 h-4 text-purple-400" />
            Actividad Reciente
          </h2>
          {recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[12px] text-white/40">Sin actividad reciente</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.slice(0, 8).map((activity, index) => (
                <div
                  key={`${activity.type}-${activity.id}-${index}`}
                  className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        activity.type === "disbursement"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-purple-500/10 text-purple-400"
                      }`}
                    >
                      {activity.type === "disbursement" ? (
                        <ArrowDownTrayIcon className="w-4 h-4" />
                      ) : (
                        <ArrowTrendingUpIcon className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-[12px] text-white/70">{activity.description}</p>
                      <p className="text-[10px] text-white/40 capitalize">{activity.status}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-white/30">{formatTimeAgo(activity.timestamp)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
