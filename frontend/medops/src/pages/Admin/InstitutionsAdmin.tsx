// src/pages/Admin/InstitutionsAdmin.tsx
import { useQuery } from "@tanstack/react-query";
import { BuildingOfficeIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { apiFetch } from "@/api/client";

interface Institution {
  id: number;
  name: string;
  tax_id: string;
  address: string;
  is_active: boolean;
  doctors_count: number;
  created_at: string;
}

export default function InstitutionsAdmin() {
  const { data: institutions, isLoading } = useQuery({
    queryKey: ["admin-institutions"],
    queryFn: () => apiFetch<Institution[]>("admin/institutions/"),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Instituciones</h1>
        <p className="text-sm text-white/40">Todas las instituciones registradas</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-white/5 rounded-xl animate-pulse" />
          ))
        ) : institutions?.length === 0 ? (
          <div className="col-span-full text-center py-12 text-white/30">
            No hay instituciones registradas
          </div>
        ) : (
          institutions?.map((inst) => (
            <div
              key={inst.id}
              className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-white/20 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                    <BuildingOfficeIcon className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-[12px] font-medium text-white">{inst.name}</h3>
                    <p className="text-[10px] text-white/40">{inst.tax_id}</p>
                  </div>
                </div>
                {inst.is_active ? (
                  <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
                ) : (
                  <XCircleIcon className="w-4 h-4 text-red-400" />
                )}
              </div>
              <div className="space-y-2 text-[10px] text-white/50">
                <p>{inst.address}</p>
                <p>{inst.doctors_count} doctores</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
