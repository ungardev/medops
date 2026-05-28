// src/pages/Admin/DoctorsList.tsx
import { useQuery } from "@tanstack/react-query";
import { UsersIcon, WalletIcon, BanknotesIcon } from "@heroicons/react/24/outline";
import { apiFetch } from "@/api/client";

interface DoctorWithWallet {
  id: number;
  full_name: string;
  email: string;
  specialty: string;
  is_verified: boolean;
  wallet_balance: string;
  total_earned: string;
  institutions_count: number;
}

export default function DoctorsList() {
  const { data: doctors, isLoading } = useQuery({
    queryKey: ["admin-doctors"],
    queryFn: () => apiFetch<DoctorWithWallet[]>("admin/doctors/"),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Doctores</h1>
        <p className="text-sm text-white/40">Lista de doctores y sus wallets</p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr className="text-left text-[10px] text-white/40 uppercase tracking-wider">
                <th className="px-4 py-3 font-medium">Doctor</th>
                <th className="px-4 py-3 font-medium">Especialidad</th>
                <th className="px-4 py-3 font-medium">Wallet</th>
                <th className="px-4 py-3 font-medium">Total Ganado</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-white/30">
                    Cargando...
                  </td>
                </tr>
              ) : doctors?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-white/30">
                    No hay doctores registrados
                  </td>
                </tr>
              ) : (
                doctors?.map((doctor) => (
                  <tr key={doctor.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-500/10 rounded-full flex items-center justify-center">
                          <UsersIcon className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-[12px] font-medium text-white">{doctor.full_name}</p>
                          <p className="text-[10px] text-white/40">{doctor.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-white/60">
                      {doctor.specialty || "General"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <WalletIcon className="w-3 h-3 text-emerald-400" />
                        <span className="text-[11px] font-medium text-emerald-400">
                          ${Number(doctor.wallet_balance || 0).toFixed(2)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-white/60">
                      ${Number(doctor.total_earned || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-[9px] font-medium ${
                          doctor.is_verified
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-amber-500/10 text-amber-400"
                        }`}
                      >
                        {doctor.is_verified ? "Verificado" : "Pendiente"}
                      </span>
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
