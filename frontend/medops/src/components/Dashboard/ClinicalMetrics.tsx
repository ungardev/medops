import React, { useState } from "react";
import { useDashboard } from "@/hooks/dashboard/useDashboard";
import MetricCard from "./MetricCard";

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
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-4 lg:p-6">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Cargando métricas clínicas...
        </p>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-4 lg:p-6">
        <p className="text-sm text-red-600 dark:text-red-400">
          No se pudo cargar la información clínica.
        </p>
      </section>
    );
  }

  return (
    <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4">
      {/* Header: tablet vertical centrado, desktop horizontal intacto */}
      <div className="flex flex-col md:space-y-2 lg:space-y-0 lg:flex-row lg:items-center lg:justify-between lg:gap-4 min-w-0">
        <h3 className="text-lg font-semibold text-[#0d2c53] dark:text-white text-center md:text-center lg:text-left whitespace-nowrap mb-2 md:mb-0">
          Indicadores Clínicos
        </h3>

        {/* Botones: mobile con espacio extra arriba, tablet/desktop intactos */}
        <div className="flex w-full flex-row flex-nowrap gap-2 md:gap-2 lg:justify-end mt-2 md:mt-0">
          {(["day", "week", "month"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`flex-1 basis-0 px-3 py-1.5 text-sm rounded border transition-colors md:h-9 md:px-3 md:py-0 whitespace-nowrap ${
                range === r
                  ? "bg-[#0d2c53] text-white border-[#0d2c53] hover:bg-[#0b2444] hover:text-white dark:bg-white dark:text-black dark:border-white dark:hover:bg-gray-200 dark:hover:text-black"
                  : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
              }`}
            >
              {r === "day" ? "Hoy" : r === "week" ? "Semana" : "Mes"}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 min-w-0">
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
