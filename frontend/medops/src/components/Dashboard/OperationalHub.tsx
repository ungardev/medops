// src/components/Dashboard/OperationalHub.tsx
import React, { useState, useEffect } from "react";
import moment from "moment";
import { MapPinIcon, ClockIcon, CalendarIcon } from "@heroicons/react/24/outline";

const OperationalHub: React.FC = () => {
  const [now, setNow] = useState(moment());

  useEffect(() => {
    const timer = setInterval(() => setNow(moment()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-[var(--palantir-surface)] border border-[var(--palantir-border)] rounded-sm p-4 flex flex-col h-full shadow-sm">
      {/* Header Técnico Compacto */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-1 rounded-full bg-[var(--palantir-active)] animate-pulse" />
          <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--palantir-muted)]">
            Ops_Station
          </h3>
        </div>
        <span className="text-[8px] font-mono text-[var(--palantir-active)]/70 px-1.5 py-0.5 rounded-sm border border-[var(--palantir-active)]/20">
          ONLINE
        </span>
      </div>

      {/* Contenido Flexible: justify-between asegura que la ubicación toque el fondo del padding */}
      <div className="flex-1 flex flex-col justify-between">
        
        {/* Reloj */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-[var(--palantir-muted)] mb-1">
            <ClockIcon className="w-3 h-3" />
            <span className="text-[9px] font-bold uppercase tracking-widest">System_Chrono</span>
          </div>
          <span className="text-3xl font-black font-mono text-[var(--palantir-text)] leading-none tracking-tighter">
            {now.format("HH:mm:ss")}
          </span>
          <span className="text-[9px] font-mono text-[var(--palantir-active)] mt-1 opacity-80">
            UTC-4 VET_TZ
          </span>
        </div>

        {/* Fecha */}
        <div className="flex flex-col border-l border-[var(--palantir-border)] pl-3 py-0.5">
          <div className="flex items-center gap-1.5 text-[var(--palantir-muted)] mb-1">
            <CalendarIcon className="w-3 h-3" />
            <span className="text-[9px] font-bold uppercase tracking-widest">Deployment</span>
          </div>
          <span className="text-xs font-bold text-[var(--palantir-text)] uppercase tracking-tight">
            {now.format("dddd, DD MMMM")}
          </span>
        </div>

        {/* Ubicación Compacta - Ahora es el elemento final del contenedor */}
        <div className="bg-[var(--palantir-bg)]/40 border border-[var(--palantir-border)] p-2.5 rounded-sm">
          <div className="flex items-center gap-1.5 text-[var(--palantir-muted)] mb-1">
            <MapPinIcon className="w-3 h-3 text-red-500/80" />
            <span className="text-[9px] font-bold uppercase tracking-widest">Location</span>
          </div>
          <p className="text-[11px] font-black text-[var(--palantir-text)] uppercase leading-tight tracking-tight">
            Caracas, Venezuela
          </p>
          <p className="text-[8px] font-mono text-[var(--palantir-muted)] mt-0.5">
            10.48° N / 66.90° W
          </p>
        </div>
      </div>
    </div>
  );
};

export default OperationalHub;
