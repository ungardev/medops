// src/components/Wallet/WalletMovements.tsx
import { ArrowUpIcon, ArrowDownIcon, BanknotesIcon } from "@heroicons/react/24/outline";
import { useWalletMovements } from "@/hooks/wallet/useWallet";

export function WalletMovements() {
  const { data, isLoading } = useWalletMovements(5);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "Hace minutos";
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays === 1) return "Ayer";
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return date.toLocaleDateString("es-VE", { month: "short", day: "numeric" });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h3 className="text-[11px] font-medium text-white/60 uppercase tracking-wider">
          Últimos Movimientos
        </h3>
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-white/5 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const movements = data?.movements || [];

  if (movements.length === 0) {
    return (
      <div className="space-y-3">
        <h3 className="text-[11px] font-medium text-white/60 uppercase tracking-wider">
          Últimos Movimientos
        </h3>
        <div className="flex flex-col items-center justify-center py-8 text-white/20">
          <BanknotesIcon className="w-8 h-8 mb-2" />
          <p className="text-[11px]">Sin movimientos aún</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-medium text-white/60 uppercase tracking-wider">
          Últimos Movimientos
        </h3>
        <button className="text-[10px] text-emerald-400 hover:text-emerald-300 transition-colors">
          Ver todos →
        </button>
      </div>

      <div className="space-y-2">
        {movements.map((movement, index) => {
          const isPayment = movement.type === "payment";
          const item = movement.data;
          const amount = isPayment ? item.amount : item.amount;
          const isPositive = isPayment;
          const institutionName = isPayment
            ? item.charge_order?.institution?.name || "—"
            : "BANCARIBE";

          return (
            <div
              key={`${movement.type}-${item.id}-${index}`}
              className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isPositive
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-red-500/10 text-red-400"
                  }`}
                >
                  {isPositive ? (
                    <ArrowUpIcon className="w-4 h-4" />
                  ) : (
                    <ArrowDownIcon className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <p className="text-[11px] font-medium text-white/80">
                    {isPayment ? "Pago" : "Disbursement"}
                  </p>
                  <p className="text-[9px] text-white/40">{institutionName}</p>
                </div>
              </div>

              <div className="text-right">
                <p
                  className={`text-[12px] font-semibold ${
                    isPositive ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {isPositive ? "+" : "-"}${Number(amount).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className="text-[9px] text-white/30">
                  {formatTime(item.created_at)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
