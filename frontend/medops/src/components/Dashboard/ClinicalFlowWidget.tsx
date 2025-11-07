// src/components/Dashboard/ClinicalFlowWidget.tsx
import React from "react";
import type { DashboardSummary } from "@/types/dashboard";

export function ClinicalFlowWidget({ data }: { data?: DashboardSummary }) {
  if (!data) {
    return <div className="card text-muted">Cargando flujo clínico...</div>;
  }

  return (
    <section className="card">
      <h3>Flujo clínico del día</h3>
      <div className="grid">
        <div>
          <div className="summary-label">Citas</div>
          <div className="summary-value text-muted">{data.total_appointments}</div>
        </div>
        <div>
          <div className="summary-label">Completadas</div>
          <div className="summary-value text-success">{data.completed_appointments}</div>
        </div>
        <div>
          <div className="summary-label">Pendientes</div>
          <div className="summary-value text-warning">{data.pending_appointments}</div>
        </div>
        <div>
          <div className="summary-label">Exoneradas</div>
          <div className="summary-value text-danger">{data.total_waived}</div>
        </div>
      </div>
    </section>
  );
}
