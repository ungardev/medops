// src/pages/Dashboard/index.tsx
import React, { useEffect } from "react";
import ClinicalMetrics from "@/components/Dashboard/ClinicalMetrics";
import FinancialMetrics from "@/components/Dashboard/FinancialMetrics";
import TrendsChart from "@/components/Dashboard/TrendsChart";
import NotificationsFeed from "@/components/Dashboard/NotificationsFeed";
import AuditLog from "@/components/Dashboard/AuditLog";
import { useAuthToken } from "@/hooks/useAuthToken";
import { queryClient } from "@/lib/reactQuery";

export default function Dashboard() {
  const { token } = useAuthToken();

  useEffect(() => {
    if (token) {
      queryClient.invalidateQueries({ queryKey: ["notifications", token] });
    }
  }, [token]);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-6">
      {/* 🔹 Línea 1: Métricas clínicas */}
      <section>
        <ClinicalMetrics />
      </section>

      {/* 🔹 Línea 2: Métricas financieras */}
      <section>
        <FinancialMetrics />
      </section>

      {/* 🔹 Línea 3: Tendencias + Notificaciones */}
      <section className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-4 items-stretch">
        <div className="h-full">
          <TrendsChart />
        </div>
        <div className="h-full">
          <NotificationsFeed />
        </div>
      </section>

      {/* 🔹 Línea 4: Auditoría */}
      <section>
        <AuditLog />
      </section>
    </div>
  );
}
