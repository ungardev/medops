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
      {/* Mantenemos el contenedor principal con un padding superior controlado (py-2) 
         para que el PageHeader pegue lo más arriba posible sin tocar el buscador global.
      */}
      <div className="max-w-[1600px] mx-auto px-4 py-2 space-y-6 animate-in fade-in duration-700">
        
        {/* ORDEN 01: PAGE HEADER (Elite & Institutional)
           Este es el componente que debe renderizarse primero. 
           Inyectamos el DashboardButtonGroup directamente en la prop 'actions'.
        */}
        <PageHeader 
          title="Panel de Control" 
          breadcrumb="MEDOPS // MEDICAL_OPERATIVE_SYSTEM"
          actions={<DashboardButtonGroup />}
          stats={[
            { label: "OPS_NODE", value: "CENTRAL_SBY", color: "text-emerald-500" },
            { label: "DATA_RELAY", value: "STABLE", color: "text-[var(--palantir-active)]" }
          ]}
        />

        {/* ORDEN 02: MÉTRICAS (Resumen de Impacto) */}
        <section className="animate-in slide-in-from-bottom-2 duration-700 delay-150">
          <MetricsRow />
        </section>

        {/* ORDEN 03: TRIADA OPERACIONAL (Visualización Compleja) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          <div className="lg:col-span-3">
            <OperationalHub />
          </div>

          <div className="lg:col-span-6">
            <TrendsChart />
          </div>

          <div className="lg:col-span-3">
            <NotificationsFeed />
          </div>
        </section>

        {/* ORDEN 04: LOG DE AUDITORÍA (Base de la página) */}
        <section className="pt-2 border-t border-[var(--palantir-border)]/20">
          <AuditLog />
        </section>

      </div>
    </DashboardFiltersProvider>
  );
}
