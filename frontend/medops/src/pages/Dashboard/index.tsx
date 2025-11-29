import React from "react";
import ClinicalMetrics from "@/components/Dashboard/ClinicalMetrics";
import FinancialMetrics from "@/components/Dashboard/FinancialMetrics";
import TrendsChart from "@/components/Dashboard/TrendsChart";
import NotificationsFeed from "@/components/Dashboard/NotificationsFeed";
import AuditLog from "@/components/Dashboard/AuditLog";

export default function Dashboard() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 px-6 py-8">
      {/* 🔹 Métricas clínicas y financieras */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ClinicalMetrics />
        <FinancialMetrics />
      </section>

      {/* 🔹 Tendencias y notificaciones */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TrendsChart />
        <NotificationsFeed />
      </section>

      {/* 🔹 Audit log */}
      <section>
        <AuditLog />
      </section>
    </div>
  );
}
