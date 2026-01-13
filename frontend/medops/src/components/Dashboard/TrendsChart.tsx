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

  // Definición de Colores Estándar MEDOPS (Hardcoded para evitar parpadeos)
  const colors = {
    citas: "#38a1ff", // Palantir Blue
    pagos: "#10b981", // Emerald
    grid: "rgba(255, 255, 255, 0.03)",
    text: "rgba(255, 255, 255, 0.4)",
    tooltipBg: "#0c0e12",
    tooltipBorder: "rgba(255, 255, 255, 0.1)",
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
            label: "Citas_Active",
            data: labels.map(d => citas.find((p: any) => p.date === d)?.value ?? 0),
            borderColor: colors.citas,
            backgroundColor: (ctx: any) => {
              const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 400);
              gradient.addColorStop(0, `${colors.citas}22`);
              gradient.addColorStop(1, "transparent");
              return gradient;
            },
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            borderWidth: 2,
          },
          {
            label: `Ingresos_${currency}`,
            data: labels.map(d => pagos.find((p: any) => p.date === d)?.value ?? 0),
            borderColor: colors.pagos,
            backgroundColor: "transparent",
            fill: false,
            tension: 0.4,
            pointRadius: 0,
            borderWidth: 1.5,
            borderDash: [4, 4],
          }
        ],
      });
    }
  }, [data, currency]);

  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: "top",
        align: "end",
        labels: { 
            color: colors.text, 
            font: { size: 8, weight: 'bold' as any }, 
            boxWidth: 6, 
            usePointStyle: true,
            padding: 15
        },
      },
      tooltip: {
        backgroundColor: colors.tooltipBg,
        titleColor: "white",
        bodyColor: colors.text,
        borderColor: colors.tooltipBorder,
        borderWidth: 1,
        padding: 10,
        cornerRadius: 2,
        titleFont: { size: 10, family: 'monospace' },
        bodyFont: { size: 10, family: 'monospace' },
      }
    },
    scales: {
      x: { 
        grid: { display: false }, 
        ticks: { 
          color: colors.text, 
          font: { size: 8, family: 'monospace' },
          maxRotation: 0
        } 
      },
      y: { 
        grid: { color: colors.grid }, 
        border: { display: false },
        ticks: { 
          color: colors.text, 
          font: { size: 8, family: 'monospace' },
          padding: 10
        } 
      },
    },
  };

  return (
    <div className="h-full flex flex-col bg-[#0c0e12] border border-white/[0.05] rounded-sm overflow-hidden group shadow-2xl">
      {/* Header Estilo Terminal */}
      <div className="px-4 py-2 bg-white/[0.02] border-b border-white/[0.05] flex justify-between items-center transition-colors group-hover:bg-white/[0.04]">
        <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-[var(--palantir-active)] rounded-full animate-pulse shadow-[0_0_5px_var(--palantir-active)]"></div>
            <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50">Trends_System_Analytics</h3>
        </div>
        <div className="flex gap-1.5">
          <span className="text-[8px] font-mono text-white/20 uppercase tracking-tighter">Status: Nominal</span>
          <div className="w-[1px] h-3 bg-white/10 mx-1"></div>
          <div className="flex gap-1">
             <div className="w-2 h-[2px] bg-white/10"></div>
             <div className="w-2 h-[2px] bg-white/10"></div>
          </div>
        </div>
      </div>
      
      <div className="p-5 flex-1 min-h-[220px]">
        {chartData ? (
          <Line data={chartData} options={chartOptions} />
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-[var(--palantir-active)]/20 border-t-[var(--palantir-active)] rounded-full animate-spin"></div>
            <span className="text-[10px] text-white/20 font-mono tracking-[0.3em] uppercase animate-pulse">
                Initing_Stream...
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrendsChart;
