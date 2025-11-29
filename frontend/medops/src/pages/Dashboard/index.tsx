import React from "react";
import ClinicalMetrics from "@/components/Dashboard/ClinicalMetrics";
import FinancialMetrics from "@/components/Dashboard/FinancialMetrics";
import TrendsChart from "@/components/Dashboard/TrendsChart";
import NotificationsFeed from "@/components/Dashboard/NotificationsFeed";
import AuditLog from "@/components/Dashboard/AuditLog";

export default function Dashboard() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6 sm:space-y-8">
      {/* 🔹 Métricas clínicas y financieras */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="w-full rounded-lg shadow-md bg-white dark:bg-gray-800 p-4">
          <ClinicalMetrics />
        </div>
        <div className="w-full rounded-lg shadow-md bg-white dark:bg-gray-800 p-4">
          <FinancialMetrics />
        </div>
      </section>

      {/* 🔹 Tendencias y notificaciones */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="w-full rounded-lg shadow-md bg-white dark:bg-gray-800 p-4">
          <TrendsChart />
        </div>
        <div className="w-full rounded-lg shadow-md bg-white dark:bg-gray-800 p-4">
          <NotificationsFeed />
        </div>
      </section>

      {/* 🔹 Audit log */}
      <section className="w-full rounded-lg shadow-md bg-white dark:bg-gray-800 p-4">
        <AuditLog />
      </section>
    </div>
  );
}
