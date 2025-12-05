import React from "react";
import ClinicalMetrics from "@/components/Dashboard/ClinicalMetrics";
import FinancialMetrics from "@/components/Dashboard/FinancialMetrics";
import TrendsChart from "@/components/Dashboard/TrendsChart";
import NotificationsFeed from "@/components/Dashboard/NotificationsFeed";
import AuditLog from "@/components/Dashboard/AuditLog";

export default function Dashboard() {
  const cardBase =
    "w-full rounded-lg shadow-md bg-white dark:bg-gray-800 p-3 sm:p-4 md:p-4";
  const cardTall = `${cardBase} min-h-[300px]`; // métricas clínicas y financieras
  const cardWide = `${cardBase} min-h-[360px]`; // tendencias y notificaciones

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 md:px-6 py-3 sm:py-6 md:py-6 space-y-6 sm:space-y-8 md:space-y-8">
      {/* 🔹 Métricas clínicas y financieras */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-6 items-stretch">
        <div className={cardTall}>
          <ClinicalMetrics />
        </div>
        <div className={cardTall}>
          <FinancialMetrics />
        </div>
      </section>

      {/* 🔹 Tendencias y notificaciones */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-6 items-stretch">
        <div className={cardWide}>
          <TrendsChart />
        </div>
        <div className={cardWide}>
          <NotificationsFeed />
        </div>
      </section>

      {/* 🔹 Audit log */}
      <section className={cardBase}>
        <AuditLog />
      </section>
    </div>
  );
}
