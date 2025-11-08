import React from "react";
import TopBar from "@/components/Dashboard/TopBar";
import ClinicalMetrics from "@/components/Dashboard/ClinicalMetrics";
import FinancialMetrics from "@/components/Dashboard/FinancialMetrics";
import TrendsChart from "@/components/Dashboard/TrendsChart";
import NotificationsFeed from "@/components/Dashboard/NotificationsFeed";
import AuditLog from "@/components/Dashboard/AuditLog";

export default function Dashboard() {
  return (
    <div className="dashboard-container">
      <TopBar />
      <div className="dashboard-main">
        <div className="dashboard-content">
          <div className="grid-2col">
            <ClinicalMetrics />
            <FinancialMetrics />
          </div>

          <div className="grid-2col">
            <TrendsChart />
            <NotificationsFeed />
          </div>

          <AuditLog />
        </div>
      </div>
    </div>
  );
}
