// src/pages/Dashboard/index.tsx
import React, { useEffect } from "react";
import MetricsRow from "@/components/Dashboard/MetricsRow";
import TrendsChart from "@/components/Dashboard/TrendsChart";
import NotificationsFeed from "@/components/Dashboard/NotificationsFeed";
import AuditLog from "@/components/Dashboard/AuditLog";
import OperationalHub from "@/components/Dashboard/OperationalHub";
import PageHeader from "@/components/Common/PageHeader"; // Importamos el nuevo Header
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
      <div className="max-w-[1600px] mx-auto px-4 py-4 space-y-6 animate-in fade-in duration-700">
        
        {/* 🔹 PageHeader Elite: Centralizamos Título, Breadcrumb y Acciones */}
        <PageHeader 
          title="Panel de Control" 
          breadcrumb="MEDOPS // MEDICAL_OPERATIVE_SYSTEM"
          actions={<DashboardButtonGroup />}
          // Puedes pasar stats aquí si quieres ver métricas críticas en el header
          // stats={[
          //   { label: "Status", value: "ONLINE", color: "text-emerald-500" },
          //   { label: "Encrypted", value: "AES-256", color: "text-[var(--palantir-active)]" }
          // ]}
        />

        {/* 🔹 Fila de Métricas: Ahora respira mejor bajo el nuevo Header */}
        <section className="animate-in slide-in-from-bottom-2 duration-700 delay-100">
          <MetricsRow />
        </section>

        {/* 🔹 Triada Operacional: Alineación técnica de alto rendimiento */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          
          <div className="lg:col-span-3 border border-[var(--palantir-border)]/10 bg-black/5 rounded-sm p-1">
            <OperationalHub />
          </div>

          <div className="lg:col-span-6 border border-[var(--palantir-border)]/10 bg-black/5 rounded-sm p-1">
            <TrendsChart />
          </div>

          <div className="lg:col-span-3 border border-[var(--palantir-border)]/10 bg-black/5 rounded-sm p-1">
            <NotificationsFeed />
          </div>

        </section>

        {/* 🔹 Auditoría: Registro de eventos del sistema */}
        <section className="border-t border-[var(--palantir-border)]/20 pt-4">
          <AuditLog />
        </section>

      </div>
    </DashboardFiltersProvider>
  );
}
