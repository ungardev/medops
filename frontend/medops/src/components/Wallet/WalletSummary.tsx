// src/components/Wallet/WalletSummary.tsx
import {
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import type { WalletSummary } from "@/api/wallet";

interface WalletSummaryProps {
  summary: WalletSummary | undefined;
}

export function WalletSummary({ summary }: WalletSummaryProps) {
  const stats = [
    {
      label: "Pendiente",
      value: summary?.pending_balance || "0.00",
      icon: ClockIcon,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
    },
    {
      label: "Total Ganado",
      value: summary?.total_earned || "0.00",
      icon: ArrowTrendingUpIcon,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Total Retirado",
      value: summary?.total_disbursed || "0.00",
      icon: ArrowDownTrayIcon,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`${stat.bgColor} border border-white/10 rounded-lg p-3`}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <stat.icon className={`w-3 h-3 ${stat.color}`} />
            <span className="text-[9px] text-white/40 uppercase tracking-wider">
              {stat.label}
            </span>
          </div>
          <div className={`text-sm font-semibold ${stat.color}`}>
            ${Number(stat.value).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
