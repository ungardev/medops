// src/components/Dashboard/OperationalHub.tsx
import React, { useState, useEffect, useMemo } from "react";
import moment from "moment";
import { MapPinIcon, ClockIcon, CalendarIcon } from "@heroicons/react/24/outline";
import { useInstitutionSettings } from "@/hooks/settings/useInstitutionSettings";
import { Neighborhood } from "@/types/config";

const OperationalHub: React.FC = () => {
  const [now, setNow] = useState(moment());
  
  // Obtenemos la configuración de la institución
  const { data: instData } = useInstitutionSettings();

  useEffect(() => {
    const timer = setInterval(() => setNow(moment()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Resolución Dinámica de Ubicación basada en la jerarquía de Neighborhood
  const locationInfo = useMemo(() => {
    // Verificamos si neighborhood viene como objeto completo (ya que puede ser number | Neighborhood)
    const geo = instData?.neighborhood as Neighborhood | undefined;
    
    if (!instData || !geo?.parish) {
      return { 
        full: "INITIALIZING_STATION...", 
        tz: "UTC_SYNC", 
        coords: "00.00° / 00.00°" 
      };
    }

    // Navegamos la jerarquía definida en tu interfaz: neighborhood -> parish -> municipality -> state -> country
    const stateName = geo.parish.municipality?.state?.name || "Unknown State";
    const countryName = geo.parish.municipality?.state?.country?.name || "Global";

    return {
      full: `${stateName}, ${countryName}`,
      // Lógica universal: VET_TZ si es Venezuela, de lo contrario LOCAL_TZ
      tz: countryName.toUpperCase().includes("VENEZUELA") ? "VET_TZ" : "LOCAL_TZ",
      // Estética técnica basada en los IDs de la jerarquía
      coords: `${geo.parish.id || '00'}.${geo.id || '00'}° N / ${geo.parish.municipality?.id || '00'}.88° W`
    };
  }, [instData]);

  return (
    <div className="bg-[var(--palantir-surface)] border border-[var(--palantir-border)] rounded-sm p-4 flex flex-col h-full shadow-sm">
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

      <div className="flex-1 flex flex-col justify-between">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-[var(--palantir-muted)] mb-1">
            <ClockIcon className="w-3 h-3" />
            <span className="text-[9px] font-bold uppercase tracking-widest">System_Chrono</span>
          </div>
          <span className="text-3xl font-black font-mono text-[var(--palantir-text)] leading-none tracking-tighter">
            {now.format("HH:mm:ss")}
          </span>
          <span className="text-[9px] font-mono text-[var(--palantir-active)] mt-1 opacity-80 uppercase">
             UTC-4 {locationInfo.tz}
          </span>
        </div>

        <div className="flex flex-col border-l border-[var(--palantir-border)] pl-3 py-0.5">
          <div className="flex items-center gap-1.5 text-[var(--palantir-muted)] mb-1">
            <CalendarIcon className="w-3 h-3" />
            <span className="text-[9px] font-bold uppercase tracking-widest">Deployment</span>
          </div>
          <span className="text-xs font-bold text-[var(--palantir-text)] uppercase tracking-tight">
            {now.format("dddd, DD MMMM")}
          </span>
        </div>

        <div className="bg-[var(--palantir-bg)]/40 border border-[var(--palantir-border)] p-2.5 rounded-sm">
          <div className="flex items-center gap-1.5 text-[var(--palantir-muted)] mb-1">
            <MapPinIcon className="w-3 h-3 text-red-500/80" />
            <span className="text-[9px] font-bold uppercase tracking-widest">Location</span>
          </div>
          <p className="text-[11px] font-black text-[var(--palantir-text)] uppercase leading-tight tracking-tight">
            {locationInfo.full}
          </p>
          <p className="text-[8px] font-mono text-[var(--palantir-muted)] mt-0.5 tracking-tighter">
            {locationInfo.coords}
          </p>
        </div>
      </div>
    </div>
  );
};

export default OperationalHub;
