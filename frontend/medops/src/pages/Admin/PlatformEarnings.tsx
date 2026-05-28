// src/pages/Admin/PlatformEarnings.tsx
import { useQuery } from "@tanstack/react-query";
import { ChartBarIcon, ArrowTrendingUpIcon, BanknotesIcon } from "@heroicons/react/24/outline";
import { apiFetch } from "@/api/client";

interface EarningsData {
  earnings: Array<{
    id: number;
    transaction_reference: string;
    gross_amount: string;
    commission_rate: string;
    commission_amount: string;
    net_amount: string;
    currency: string;
    created_at: string;
  }>;
  totals: {
    total_gross: string | null;
    total_commission: string | null;
    total_net: string | null;
  };
}

export default function PlatformEarnings() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-earnings"],
    queryFn: () => apiFetch<EarningsData>("admin/earnings/"),
  });

  const totals = data?.totals || { total_gross: null, total_commission: null, total_net: null };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Platform Earnings</h1>
        <p className="text-sm text-white/40">Comisiones de MEDOPZ</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <BanknotesIcon className="w-5 h-5 text-emerald-400" />
            <span className="text-[10px] font-medium uppercase tracking-wider text-white/40">
              Total Bruto
            </span>
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            ${Number(totals.total_gross || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <ArrowTrendingUpIcon className="w-5 h-5 text-purple-400" />
            <span className="text-[10px] font-medium uppercase tracking-wider text-white/40">
              Comisión Total
            </span>
          </div>
          <div className="text-2xl font-bold text-purple-400">
            ${Number(totals.total_commission || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <ChartBarIcon className="w-5 h-5 text-blue-400" />
            <span className="text-[10px] font-medium uppercase tracking-wider text-white/40">
              Neto Total
            </span>
          </div>
          <div className="text-2xl font-bold text-blue-400">
            ${Number(totals.total_net || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Earnings Table */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr className="text-left text-[10px] text-white/40 uppercase tracking-wider">
                <th className="px-4 py-3 font-medium">Referencia</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Monto Bruto</th>
                <th className="px-4 py-3 font-medium">Tasa</th>
                <th className="px-4 py-3 font-medium">Comisión</th>
                <th className="px-4 py-3 font-medium">Neto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-white/30">
                    Cargando...
                  </td>
                </tr>
              ) : data?.earnings?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-white/30">
                    No hay earnings registrados
                  </td>
                </tr>
              ) : (
                data?.earnings?.map((e) => (
                  <tr key={e.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-[11px] font-mono text-white/60">
                        {e.transaction_reference}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-white/50">
                      {new Date(e.created_at).toLocaleDateString("es-VE")}
                    </td>
                    <td className="px-4 py-3 text-[11px] text-white/80">
                      ${Number(e.gross_amount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-[11px] text-white/50">
                      {(Number(e.commission_rate) * 100).toFixed(1)}%
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] font-medium text-purple-400">
                        ${Number(e.commission_amount).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-emerald-400">
                      ${Number(e.net_amount).toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
