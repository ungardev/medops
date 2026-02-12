// src/components/Dashboard/OperationalHub.tsx
import React, { useState, useEffect, useMemo } from "react";
import moment from "moment";
import { MapPinIcon, ClockIcon, CalendarIcon } from "@heroicons/react/24/outline";
import { usePublicInstitutionLocation } from "@/hooks/settings/usePublicInstitutionLocation";
const OperationalHub: React.FC = () => {
  const [now, setNow] = useState(moment());
  const { data: locationData } = usePublicInstitutionLocation();
  useEffect(() => {
    const timer = setInterval(() => setNow(moment()), 1000);
    return () => clearInterval(timer);
  }, []);
  const locationInfo = useMemo(() => {
    if (!locationData || locationData.status !== 'operational') {
      return { 
        full: "STATION_OFFLINE", 
        tz: "UTC_SYNC", 
        coords: "00.00° / 00.00°" 
      };
    }
    
    const loc = locationData.location;
    const full = [
      loc.neighborhood,
      loc.municipality,
      loc.state,
      loc.country
    ].filter(Boolean).join(', ');
    
    return {
      full: full || locationData.name,
      tz: locationData.timezone,
      coords: loc.coordinates || "00.00° / 00.00°"
    };
  }, [locationData]);
  return (
    <div className="bg-[#0c0e12] border border-white/[0.05] rounded-sm p-5 flex flex-col h-full shadow-2xl group transition-all duration-500">
      {/* HEADER DE MÓDULO */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-[var(--palantir-active)] rounded-full animate-pulse shadow-[0_0_8px_var(--palantir-active)]" />
          <h3 className="text-[9px] font-black uppercase tracking-[0.25em] text-white/40 group-hover:text-white/60 transition-colors">
            Ops_Station_v4.0
          </h3>
        </div>
        <span className="text-[7px] font-black font-mono text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded-sm border border-emerald-500/10 tracking-[0.2em]">
          UPLINK_STABLE
        </span>
      </div>
      <div className="flex-1 flex flex-col justify-between gap-6">
        {/* CRONÓMETRO DE SISTEMA */}
        <div className="flex flex-col relative">
          <div className="flex items-center gap-2 text-white/20 mb-1">
            <ClockIcon className="w-3 h-3" />
            <span className="text-[8px] font-black uppercase tracking-[0.2em]">System_Chrono</span>
          </div>
          <span className="text-4xl font-black font-mono text-white leading-none tracking-tighter group-hover:text-[var(--palantir-active)] transition-colors duration-500">
            {now.format("HH:mm:ss")}
          </span>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[8px] font-mono font-bold text-[var(--palantir-active)] opacity-60 uppercase bg-[var(--palantir-active)]/5 px-1 py-0.5">
               UTC-4 {locationInfo.tz}
            </span>
            <div className="h-[1px] flex-1 bg-white/[0.03]"></div>
          </div>
        </div>
        {/* CALENDARIO DE DESPLIEGUE */}
        <div className="flex flex-col border-l-2 border-white/[0.05] pl-4 py-1 group-hover:border-[var(--palantir-active)]/30 transition-colors">
          <div className="flex items-center gap-2 text-white/20 mb-1">
            <CalendarIcon className="w-3 h-3" />
            <span className="text-[8px] font-black uppercase tracking-[0.2em]">Deployment_Date</span>
          </div>
          <span className="text-[11px] font-black text-white/70 uppercase tracking-widest font-mono">
            {now.format("dddd, DD MMMM YYYY")}
          </span>
        </div>
        {/* GEOLOCALIZACIÓN Y COORDENADAS */}
        <div className="bg-white/[0.02] border border-white/[0.05] p-3 rounded-sm group-hover:bg-white/[0.04] transition-all">
          <div className="flex items-center gap-2 text-white/20 mb-2">
            <MapPinIcon className="w-3 h-3 text-red-500/60 group-hover:text-red-500 transition-colors" />
            <span className="text-[8px] font-black uppercase tracking-[0.2em]">Geo_Coordinates</span>
          </div>
          <p className="text-[10px] font-black text-white/80 uppercase leading-tight tracking-[0.1em]">
            {locationInfo.full}
          </p>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-[8px] font-mono text-white/20 tracking-tighter group-hover:text-white/40 transition-colors">
              {locationInfo.coords}
            </p>
            <span className="text-[7px] font-mono text-white/10 uppercase">Auth_Node_S2</span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default OperationalHub;