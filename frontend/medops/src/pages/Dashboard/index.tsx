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
           1. Cambiamos breadcrumb (string) por breadcrumbs (array funcional).
           2. Subtítulo dinámico para mayor contexto operativo.
           3. Stats con colores de alta visibilidad.
        */}
        <PageHeader 
          title="Panel de Control" 
          subtitle="MONITOREO DE SISTEMA OPERATIVO MÉDICO // NIVEL 01"
          breadcrumbs={[
            { label: "MEDOPS", path: "/" },
            { label: "MEDICAL_OPERATIVE_SYSTEM", active: true }
          ]}
          actions={<DashboardButtonGroup />}
          stats={[
            { 
              label: "OPS_NODE", 
              value: "CENTRAL_SBY", 
              color: "text-emerald-400" // Verde esmeralda vibrante
            },
            { 
              label: "DATA_RELAY", 
              value: "STABLE", 
              color: "text-cyan-400" // Cian eléctrico
            },
            { 
              label: "ENCRYPT_LEVEL", 
              value: "AES_256", 
              color: "text-white/60" 
            }
          ]}
        />

        {/* MÉTRICAS: Se benefician del nuevo espaciado del Header */}
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
             <div className="w-1 h-1 bg-[var(--palantir-active)] rounded-full animate-pulse" />
             <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Auditoría_Operacional_Live</span>
          </div>
          <AuditLog />
        </section>

      </div>
    </DashboardFiltersProvider>
  );
}
