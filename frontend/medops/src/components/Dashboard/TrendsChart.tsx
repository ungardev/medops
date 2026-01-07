// src/components/Dashboard/TrendsChart.tsx
import React, { useRef, useLayoutEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Filler, type ChartOptions
} from "chart.js";
import { useDashboard } from "@/hooks/dashboard/useDashboard";
import { useDashboardFilters } from "@/context/DashboardFiltersContext";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Filler);

const TrendsChart: React.FC = () => {
  const { range, currency } = useDashboardFilters();
  const { data } = useDashboard({ range, currency });
  const [chartData, setChartData] = useState<any>(null);

  const isDark = document.documentElement.classList.contains("dark");

  const palette = {
    citas: "#38a1ff", 
    pagos: "#10b981", 
    grid: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
    text: isDark ? "#8a9ba8" : "#5c7080",
    tooltipBg: isDark ? "#182026" : "#ffffff",
    tooltipBorder: isDark ? "#24313c" : "#d8e1e8",
  };

  const citas = data?.appointments_trend || [];
  const pagos = data?.payments_trend || [];

  const allDates = [...citas.map((p: any) => p.date), ...pagos.map((p: any) => p.date)].filter(Boolean);
  let labels: string[] = [];
  if (allDates.length) {
    const minDate = new Date(Math.min(...allDates.map((d: any) => new Date(d).getTime())));
    const maxDate = new Date(Math.max(...allDates.map((d: any) => new Date(d).getTime())));
    for (let d = new Date(minDate); d <= maxDate; d.setDate(d.getDate() + 1)) {
      labels.push(d.toISOString().split("T")[0]);
    }
  }

  useLayoutEffect(() => {
    if (labels.length) {
      setChartData({
        labels,
        datasets: [
          {
            label: "Citas",
            data: labels.map(d => citas.find((p: any) => p.date === d)?.value ?? 0),
            borderColor: palette.citas,
            backgroundColor: (ctx: any) => {
              const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 200);
              gradient.addColorStop(0, `${palette.citas}33`);
              gradient.addColorStop(1, "transparent");
              return gradient;
            },
            fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2,
          },
          {
            label: `Ingresos (${currency})`,
            data: labels.map(d => pagos.find((p: any) => p.date === d)?.value ?? 0),
            borderColor: palette.pagos,
            backgroundColor: "transparent",
            fill: false, tension: 0.4, pointRadius: 0, borderWidth: 2, borderDash: [5, 5],
          }
        ],
      });
    }
  }, [data, currency, isDark]);

  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        align: "end",
        labels: { 
            color: palette.text, 
            font: { size: 9, weight: 'bold' as any }, 
            boxWidth: 8, 
            usePointStyle: true,
            padding: 10
        },
      },
      tooltip: {
        backgroundColor: palette.tooltipBg,
        titleColor: palette.text,
        bodyColor: palette.text,
        borderColor: palette.tooltipBorder,
        borderWidth: 1,
        padding: 8,
        bodyFont: { size: 11 },
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: palette.text, font: { size: 9 } } },
      y: { grid: { color: palette.grid }, ticks: { color: palette.text, font: { size: 9 } } },
    },
  };

  return (
    /* h-full para igualar a sus compañeros y rounded-sm para consistencia Palantir */
    <div className="h-full flex flex-col bg-[var(--palantir-surface)] border border-[var(--palantir-border)] rounded-sm shadow-sm overflow-hidden">
      {/* Header compactado */}
      <div className="px-4 py-2 border-b border-[var(--palantir-border)] bg-[var(--palantir-bg)]/30 flex justify-between items-center">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--palantir-muted)]">Flujo_Operativo_Analytics</h3>
        <div className="flex gap-2 opacity-50">
          <div className="w-1 h-1 rounded-full bg-[var(--palantir-active)]"></div>
          <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
        </div>
      </div>
      
      {/* Ajuste Final: flex-1 permite que el contenedor del gráfico se estire 
          exactamente lo necesario para coincidir con la altura de OperationalHub.
      */}
      <div className="p-4 flex-1 min-h-[200px]">
        {chartData ? (
          <Line data={chartData} options={chartOptions} />
        ) : (
          <div className="h-full flex items-center justify-center text-[10px] text-[var(--palantir-muted)] italic uppercase font-mono tracking-tighter">
            Calculating_Trends...
          </div>
        )}
      </div>
    </div>
  );
};

export default TrendsChart;
