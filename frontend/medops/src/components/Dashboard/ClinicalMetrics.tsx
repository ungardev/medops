// src/pages/Dashboard/ClinicalMetrics.tsx
import React, { useState } from "react";
import { useDashboard } from "@/hooks/dashboard/useDashboard";
import MetricCard from "./MetricCard";

const ClinicalMetrics: React.FC = () => {
  const [range, setRange] = useState<"day" | "week" | "month">("day");
  const { data, isLoading } = useDashboard({ range });

  const subtitleByRange: Record<"day" | "week" | "month", string> = {
    day: "Hoy",
    week: "Esta semana",
    month: "Este mes",
  };

  if (isLoading) {
    return (
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Cargando métricas clínicas...
        </p>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <p className="text-sm text-red-600 dark:text-red-400">
          No se pudo cargar la información clínica.
        </p>
      </section>
    );
  }

  return (
    <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Indicadores clínicos
        </h3>
        <div className="flex gap-2">
          {(["day", "week", "month"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 text-sm rounded border transition-colors ${
                range === r
                  ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                  : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
              }`}
            >
              {r === "day" ? "Hoy" : r === "week" ? "Semana" : "Mes"}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Citas agendadas"
          value={data.total_appointments}
          subtitle={`Pendientes: ${data.pending_appointments} — ${subtitleByRange[range]}`}
          variant={data.pending_appointments > 0 ? "warning" : "ok"}
        />
        <MetricCard
          title="Citas en espera"
          value={data.waiting_room_count ?? 0}
          subtitle={`Tiempo medio de espera — ${subtitleByRange[range]}`}
        />
        <MetricCard
          title="En consulta"
          value={data.active_consultations ?? 0}
          subtitle={`Turnos activos — ${subtitleByRange[range]}`}
        />
        <MetricCard
          title="Consultas finalizadas"
          value={data.completed_appointments}
          subtitle={`Finalizadas — ${subtitleByRange[range]}`}
          variant="ok"
        />
      </div>
    </section>
  );
};

export default ClinicalMetrics;
