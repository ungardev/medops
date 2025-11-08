import React, { useState } from "react";
import { useDashboard } from "@/hooks/dashboard/useDashboard";
import MetricCard from "./MetricCard";

const ClinicalMetrics: React.FC = () => {
  const [range, setRange] = useState<"day" | "week" | "month">("day");
  const { data, isLoading } = useDashboard({ range });

  if (isLoading) return <p>Cargando métricas clínicas...</p>;
  if (!data) return <p>No se pudo cargar la información clínica.</p>;

  return (
    <section className="dashboard-widget">
      <div className="widget-header">
        <h3>Indicadores clínicos</h3>
        <div className="widget-actions">
          {["day", "week", "month"].map((r) => (
            <button
              key={r}
              className={`btn ${range === r ? "btn-primary" : "btn-outline"}`}
              onClick={() => setRange(r as any)}
            >
              {r === "day" ? "Hoy" : r === "week" ? "Semana" : "Mes"}
            </button>
          ))}
        </div>
      </div>

      <div className="metric-grid">
        <MetricCard
          title="Citas pendientes"
          value={data.pending_appointments}
          subtitle={`Total: ${data.total_appointments}`}
          variant={data.pending_appointments > 0 ? "warning" : "ok"}
        />
        <MetricCard
          title="En sala de espera"
          value={data.waiting_room_count ?? 0}
          subtitle="Tiempo medio: 09m"
        />
        <MetricCard
          title="En consulta"
          value={data.active_consultations ?? 0}
          subtitle="Turnos activos"
        />
        <MetricCard
          title="Consultas completadas"
          value={data.completed_appointments}
          variant="ok"
        />
      </div>
    </section>
  );
};

export default ClinicalMetrics;
