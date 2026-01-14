// src/pages/Dashboard/index.tsx
import React, { useEffect } from "react";
import MetricsRow from "@/components/Dashboard/MetricsRow";
import TrendsChart from "@/components/Dashboard/TrendsChart";
import NotificationsFeed from "@/components/Dashboard/NotificationsFeed";
import AuditLog from "@/components/Dashboard/AuditLog";
import OperationalHub from "@/components/Dashboard/OperationalHub";
import PageHeader from "@/components/Common/PageHeader"; 
import { useAuthToken } from "@/hooks/useAuthToken";
import { queryClient } from "@/lib/reactQuery";
import { DashboardFiltersProvider } from "@/context/DashboardFiltersContext";
import { DashboardButtonGroup } from "@/components/Dashboard/DashboardButtonGroup";

export default function Dashboard() {
  const { token } = useAuthToken();

  useEffect(() => {
    if (token) {
      queryClient.invalidateQueries({ queryKey: ["notifications", token] });
    }
  }, [token]);

  return (
    <DashboardFiltersProvider>
      <div className="max-w-[1600px] mx-auto px-4 py-2 space-y-6 animate-in fade-in duration-700">
        
        {/* EVOLUCIÓN ELITE: 
            1. Eliminados title y subtitle: La ubicación se lee en Breadcrumbs.
            2. DashboardButtonGroup se renderiza a la derecha de las Stats.
            3. Stats de sistema en el eje central de visualización.
        */}
        <PageHeader 
          breadcrumbs={[
            { label: "MEDOPS", active: true }
          ]}
          actions={<DashboardButtonGroup />}
          stats={[
            { 
              label: "OPS_NODE", 
              value: "CENTRAL_SBY", 
              color: "text-emerald-400" 
            },
            { 
              label: "DATA_RELAY", 
              value: "STABLE", 
              color: "text-cyan-400" 
            },
            { 
              label: "ENCRYPT_LEVEL", 
              value: "AES_256", 
              color: "text-white/60" 
            }
          ]}
        />

        {/* MÉTRICAS: Elevadas gracias a la reducción de altura del Header */}
        <section className="animate-in slide-in-from-bottom-2 duration-700 delay-150">
          <MetricsRow />
        </section>

        {/* TRIADA OPERACIONAL: Grid optimizado para visualización de datos */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-3">
            <OperationalHub />
          </div>

          <div className="lg:col-span-6">
            <div className="h-full bg-white/[0.01] border border-white/5 rounded-sm p-1">
               <TrendsChart />
            </div>
          </div>

          <div className="lg:col-span-3">
            <NotificationsFeed />
          </div>
        </section>

        {/* LOG DE AUDITORÍA: Reforzado con un separador más visible */}
        <section className="pt-4 border-t border-white/10">
          <div className="flex items-center gap-2 mb-4">
             <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
             <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Auditoría_Operacional_Live</span>
          </div>
          <AuditLog />
        </section>

      </div>
    </DashboardFiltersProvider>
  );
}
