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
// ✅ NUEVO: Importar ActiveInstitutionCard y hook
import ActiveInstitutionCard from "@/components/Dashboard/ActiveInstitutionCard";
import { useActiveInstitution } from "@/hooks/dashboard/useActiveInstitution";
export default function Dashboard() {
  const { token } = useAuthToken();
  // ✅ NUEVO: Hook para datos de institución activa
  const { data: activeInstitutionData, isLoading: isLoadingInstitution } = useActiveInstitution();
  useEffect(() => {
    if (token) {
      queryClient.invalidateQueries({ queryKey: ["notifications", token] });
    }
  }, [token]);
  return (
    <DashboardFiltersProvider>
      <div className="max-w-[1600px] mx-auto px-4 py-2 space-y-6 animate-in fade-in duration-700">
        
        {/* ✅ EVOLUCIÓN ELITE: PageHeader LIMPIO - Eliminados stats técnicos */}
        <PageHeader 
          breadcrumbs={[
            { label: "MEDOPZ", active: true }
          ]}
          actions={<DashboardButtonGroup />}
          // ❌ ELIMINADO: stats array (OPS_NODE, DATA_RELAY, ENCRYPT_LEVEL)
        />
        {/* ✅ NUEVO: INSTITUCIÓN ACTIVA - Componente Elite con datos reales */}
        <section className="animate-in slide-in-from-bottom-1 duration-700 delay-50">
          <ActiveInstitutionCard 
            institution={activeInstitutionData?.institution || null}
            metrics={activeInstitutionData?.metrics}
            isLoading={isLoadingInstitution}
          />
        </section>
        {/* MÉTRICAS: Elevadas gracias al contexto institucional */}
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