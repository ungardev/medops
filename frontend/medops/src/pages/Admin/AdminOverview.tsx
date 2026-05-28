// src/pages/Admin/AdminOverview.tsx
import {
  UsersIcon,
  BanknotesIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  ArrowTrendingUpIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";

const stats = [
  {
    label: "Doctores Activos",
    value: "24",
    icon: UsersIcon,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
  },
  {
    label: "Disbursements Hoy",
    value: "$1,245",
    icon: ArrowDownTrayIcon,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
  },
  {
    label: "Earnings Mes",
    value: "$8,430",
    icon: ChartBarIcon,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
  },
  {
    label: "Instituciones",
    value: "12",
    icon: BuildingOfficeIcon,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
  },
];

const recentActivity = [
  { type: "disbursement", message: "Dr. Hernández solicitó $150", time: "Hace 5 min" },
  { type: "doctor", message: "Nuevo doctor registrado: Dra. López", time: "Hace 1h" },
  { type: "earning", message: "Comisión $12.50 de Dra. Martínez", time: "Hace 2h" },
  { type: "disbursement", message: "Disbursement $200 a Dr. García completado", time: "Hace 3h" },
];

export default function AdminOverview() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Admin Overview</h1>
        <p className="text-sm text-white/40">Resumen de la plataforma MEDOPZ</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
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

      {/* Recent Activity */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-white mb-4">Actividad Reciente</h2>
        <div className="space-y-3">
          {recentActivity.map((activity, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    activity.type === "disbursement"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : activity.type === "doctor"
                      ? "bg-blue-500/10 text-blue-400"
                      : "bg-purple-500/10 text-purple-400"
                  }`}
                >
                  {activity.type === "disbursement" ? (
                    <ArrowDownTrayIcon className="w-4 h-4" />
                  ) : activity.type === "doctor" ? (
                    <UsersIcon className="w-4 h-4" />
                  ) : (
                    <ArrowTrendingUpIcon className="w-4 h-4" />
                  )}
                </div>
                <span className="text-[12px] text-white/70">{activity.message}</span>
              </div>
              <span className="text-[10px] text-white/30">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
