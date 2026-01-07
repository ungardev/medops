// src/pages/Dashboard/index.tsx
import React, { useEffect } from "react";
import MetricsRow from "@/components/Dashboard/MetricsRow";
import TrendsChart from "@/components/Dashboard/TrendsChart";
import NotificationsFeed from "@/components/Dashboard/NotificationsFeed";
import AuditLog from "@/components/Dashboard/AuditLog";
import OperationalHub from "@/components/Dashboard/OperationalHub";
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
      {/* Reducido py-4 a py-2 para ganar espacio vertical superior e inferior */}
      <div className="max-w-[1600px] mx-auto px-4 py-2 space-y-3 animate-in fade-in duration-700">
        
        {/* 🔹 Sección Superior: Título y Filtros */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--palantir-border)]/20 pb-2">
          <div className="space-y-0.5">
            <h2 className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--palantir-muted)] leading-none opacity-80 italic">
              Medical_Operative_System
            </h2>
            <p className="text-xl font-bold text-[var(--palantir-text)] tracking-tight">Panel de Control</p>
          </div>
          <DashboardButtonGroup />
        </section>

        {/* 🔹 Fila de Métricas */}
        <section>
          <MetricsRow />
        </section>

        {/* 🔹 Triada Operacional: Alineación perfecta de base */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
          
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

        {/* 🔹 Auditoría: Sin encabezado y con padding superior mínimo para eliminar scroll */}
        <section className="pt-1">
          <AuditLog />
        </section>

      </div>
    </DashboardFiltersProvider>
  );
}
