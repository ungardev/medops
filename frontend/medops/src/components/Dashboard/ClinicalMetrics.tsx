// src/components/Dashboard/ClinicalMetrics.tsx
import React, { useState } from "react";
import { useDashboard } from "@/hooks/dashboard/useDashboard";
import MetricCard from "./MetricCard";
import ButtonGroup from "@/components/Common/ButtonGroup";

type Range = "day" | "week" | "month";

const subtitleByRange: Record<Range, string> = {
  day: "Hoy",
  week: "Esta semana",
  month: "Este mes",
};

export default function ClinicalMetrics() {
  const [range, setRange] = useState<Range>("month");
  const { data, isLoading, error } = useDashboard({ range });

  if (isLoading) {
    return (
      <section className="bg-white dark:bg-gray-800 rounded-md ring-1 ring-gray-200 dark:ring-gray-700 p-3 sm:p-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Cargando métricas clínicas...
        </p>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="bg-white dark:bg-gray-800 rounded-md ring-1 ring-gray-200 dark:ring-gray-700 p-3 sm:p-4">
        <p className="text-sm text-red-600 dark:text-red-400">
          No se pudo cargar la información clínica.
        </p>
      </section>
    );
  }

  return (
    <section className="bg-white dark:bg-gray-800 rounded-md ring-1 ring-gray-200 dark:ring-gray-700 p-3 sm:p-4 min-w-0">
      {/* Header compacto */}
      <div className="h-9 flex items-center justify-between gap-2">
        <h3 className="text-base sm:text-lg font-semibold text-[#0d2c53] dark:text-white">
          Indicadores Clínicos
        </h3>

        <ButtonGroup
          options={["day", "week", "month"]}
          selected={range}
          onSelect={setRange}
        />
      </div>

      {/* Grid: 4 columnas desde md */}
      <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-2 sm:gap-3 min-w-0">
        <MetricCard
          title="Citas agendadas"
          value={data.total_appointments}
          subtitle={`Pendientes: ${data.pending_appointments} — ${subtitleByRange[range]}`}
        />
        <MetricCard
          title="En espera"
          value={data.waiting_room_count ?? 0}
          subtitle={`En Espera — ${subtitleByRange[range]}`}
        />
        <MetricCard
          title="En consulta"
          value={data.active_consultations ?? 0}
          subtitle={`En Consulta — ${subtitleByRange[range]}`}
        />
        <MetricCard
          title="Consultas finalizadas"
          value={data.completed_appointments}
          subtitle={`Completadas — ${subtitleByRange[range]}`}
        />
      </div>
    </section>
  );
}
