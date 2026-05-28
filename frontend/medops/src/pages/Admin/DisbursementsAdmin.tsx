// src/pages/Admin/DisbursementsAdmin.tsx
import { useQuery } from "@tanstack/react-query";
import { BanknotesIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from "@heroicons/react/24/outline";
import { apiFetch } from "@/api/client";

interface Disbursement {
  id: number;
  doctor_name: string;
  reference: string;
  amount: string;
  currency: string;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  disbursement_type: string;
  created_at: string;
  bank_name: string;
}

const statusConfig = {
  pending: { icon: ClockIcon, color: "text-amber-400", bg: "bg-amber-500/10" },
  processing: { icon: ClockIcon, color: "text-blue-400", bg: "bg-blue-500/10" },
  completed: { icon: CheckCircleIcon, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  failed: { icon: XCircleIcon, color: "text-red-400", bg: "bg-red-500/10" },
  cancelled: { icon: XCircleIcon, color: "text-white/40", bg: "bg-white/5" },
};

export default function DisbursementsAdmin() {
  const { data: disbursements, isLoading } = useQuery({
    queryKey: ["admin-disbursements"],
    queryFn: () => apiFetch<Disbursement[]>("admin/disbursements/"),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Disbursements</h1>
        <p className="text-sm text-white/40">Todos los disbursements de doctores</p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr className="text-left text-[10px] text-white/40 uppercase tracking-wider">
                <th className="px-4 py-3 font-medium">Referencia</th>
                <th className="px-4 py-3 font-medium">Doctor</th>
                <th className="px-4 py-3 font-medium">Monto</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-white/30">
                    Cargando...
                  </td>
                </tr>
              ) : disbursements?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-white/30">
                    No hay disbursements
                  </td>
                </tr>
              ) : (
                disbursements?.map((d) => {
                  const config = statusConfig[d.status] || statusConfig.pending;
                  return (
                    <tr key={d.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-[11px] font-mono text-white/60">
                          {d.reference}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-white/80">
                        {d.doctor_name}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <BanknotesIcon className="w-3 h-3 text-emerald-400" />
                          <span className="text-[11px] font-medium text-emerald-400">
                            ${Number(d.amount).toFixed(2)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-white/60 capitalize">
                        {d.disbursement_type}
                      </td>
                      <td className="px-4 py-3 text-[11px] text-white/50">
                        {new Date(d.created_at).toLocaleDateString("es-VE")}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-medium ${config.bg} ${config.color}`}
                        >
                          <config.icon className="w-3 h-3" />
                          {d.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
