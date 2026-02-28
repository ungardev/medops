// src/components/Dashboard/ActiveInstitutionCard.tsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  BuildingOfficeIcon,
  ClipboardIcon,
  ClockIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  CogIcon,
  MapPinIcon,
  CalendarIcon
} from "@heroicons/react/24/outline";
import { useDashboardFilters } from "@/context/DashboardFiltersContext";
import { useActiveInstitution } from "@/hooks/dashboard/useActiveInstitution";
import { useBCVRate } from "@/hooks/dashboard/useBCVRate";
import { usePublicInstitutionLocation } from "@/hooks/settings/usePublicInstitutionLocation";
import ButtonGroup from "@/components/Common/ButtonGroup";
import moment from "moment";
import type { InstitutionSettings } from "@/types/config";
const metricsConfig = {
  scheduled_count: {
    label: "Citas Agendadas",
    icon: ClipboardIcon,
    color: "text-blue-600 dark:text-blue-400",
    href: "/appointments",
  },
  pending_count: {
    label: "Pendientes",
    icon: ClockIcon,
    color: "text-yellow-600 dark:text-yellow-400",
    href: "/appointments?status=pending",
  },
  waiting_count: {
    label: "En Espera",
    icon: ClockIcon,
    color: "text-purple-600 dark:text-purple-400",
    href: "/waitingroom",
  },
  in_consultation_count: {
    label: "En Consulta",
    icon: ClipboardIcon,
    color: "text-indigo-600 dark:text-indigo-400",
    href: "/consultation",
  },
  completed_count: {
    label: "Finalizadas",
    icon: CheckCircleIcon,
    color: "text-green-600 dark:text-green-400",
    href: "/appointments?status=completed",
  },
  total_amount: {
    label: "Total ($)",
    icon: CurrencyDollarIcon,
    color: "text-white",
    href: "/payments",
  },
  payments_count: {
    label: "Pagos",
    icon: CurrencyDollarIcon,
    color: "text-green-600 dark:text-green-400",
    href: "/payments",
  },
  exempted_count: {
    label: "Exonerados",
    icon: CurrencyDollarIcon,
    color: "text-red-600 dark:text-red-400",
    href: "/payments",
  },
};
export const ActiveInstitutionCard: React.FC = () => {
  const navigate = useNavigate();
  const { range, setRange, currency, setCurrency } = useDashboardFilters();
  
  const { data: activeData, isLoading } = useActiveInstitution({ range, currency });
  const { data: bcvRate } = useBCVRate();
  const { data: locationData } = usePublicInstitutionLocation();
  
  // Clock state
  const [now, setNow] = useState(moment());
  useEffect(() => {
    const timer = setInterval(() => setNow(moment()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  // Location info
  const locationInfo = useMemo(() => {
    if (!locationData || locationData.status !== 'operational') {
      return { full: "Sin ubicación", tz: "UTC-4" };
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
      tz: locationData.timezone || "UTC-4"
    };
  }, [locationData]);
  
  const institution = activeData?.institution;
  const metrics = activeData?.metrics;
  
  const handleConfigure = () => {
    navigate("/settings/config");
  };
  
  const handleMetricClick = (href?: string) => {
    if (href) navigate(href);
  };
  
  const getMetricLabel = (key: string): string => {
    if (key === 'total_amount') {
      return currency === 'VES' ? 'Total (VES)' : 'Total ($)';
    }
    return metricsConfig[key as keyof typeof metricsConfig].label;
  };
  
  const formatValue = (key: string, value: number): string => {
    if (key.includes('amount') || key.includes('total')) {
      return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: currency || 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    }
    return value.toLocaleString();
  };
  
  if (isLoading) {
    return (
      <div className="group relative bg-[#0A0A0A] border border-white/5 p-6 hover:border-emerald-500/30 transition-all duration-500 shadow-xl">
        <div className="flex gap-6 mb-6">
          <div className="w-20 h-20 bg-white border border-gray-200 flex items-center justify-center p-2 shrink-0">
            <div className="w-8 h-8 bg-gray-200 animate-pulse rounded" />
          </div>
          <div className="flex-1">
            <div className="h-4 bg-white/10 rounded w-48 mb-2 animate-pulse" />
            <div className="h-3 bg-white/5 rounded w-32 animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-black/20 border border-white/5 rounded-sm p-3 animate-pulse">
              <div className="h-3 bg-white/10 rounded w-16 mb-2" />
              <div className="h-4 bg-white/5 rounded w-12" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (!institution) {
    return (
      <div className="group relative bg-[#0A0A0A] border border-white/5 p-6 hover:border-emerald-500/30 transition-all duration-500 shadow-xl">
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <BuildingOfficeIcon className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/40 text-sm">No hay institución activa</p>
            <button 
              onClick={handleConfigure}
              className="mt-3 text-[10px] font-black uppercase text-emerald-500 hover:text-emerald-400 transition-colors tracking-widest"
            >
              Configurar Institución
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  const bcvDisplay = bcvRate 
    ? `${Number(bcvRate.value).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs/USD`
    : "--";
  
  return (
    <div className="group relative bg-[#0A0A0A] border border-white/5 p-6 hover:border-emerald-500/30 transition-all duration-500 shadow-xl">
      
      {/* Header responsive - flex-col en mobile, flex-row en md+, centrado en mobile */}
      <div className="flex flex-col md:flex-row items-start gap-4 mb-4">
        
        {/* Logo - fondo blanco para visibilidad, centrado en mobile */}
        <div className="w-16 md:w-20 h-16 md:h-20 bg-white border border-gray-200 flex items-center justify-center p-2 shrink-0 overflow-hidden">
          {typeof institution.logo === 'string' ? (
            <img 
              src={institution.logo} 
              className="max-h-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300" 
              alt={`${institution.name} logo`} 
            />
          ) : (
            <BuildingOfficeIcon className="w-8 h-8 text-gray-300" />
          )}
        </div>
        
        {/* Institution Info + Live Clock - LadoIzq en desktop */}
        <div className="flex-1 min-w-0 w-full">
          <div className="flex items-center gap-3 flex-wrap">
            <h4 className="text-sm font-black text-white uppercase truncate tracking-widest">
              {institution.name}
            </h4>
            
            {/* Status Indicator */}
            <div className="flex items-center gap-2">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </div>
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em]">Active</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            <div className="flex items-center gap-2">
              <button onClick={handleConfigure} className="p-1 hover:bg-white/5 rounded transition-colors">
                <CogIcon className="w-3 h-3 text-white/30 hover:text-white/60" />
              </button>
              <span className="text-[8px] font-mono text-white/20 uppercase tracking-tighter">Fiscal_UID:</span>
              <p className="text-[10px] font-mono text-white/60">{institution.tax_id || "PENDING_REGISTRATION"}</p>
            </div>
          </div>
          
          {/* ✅ LIVE CLOCK - Desktop: inline con info | Mobile: below */}
          <div className="flex items-center gap-4 mt-3 md:mt-2">
            <div className="flex items-center gap-2">
              <span className="text-xl md:text-2xl font-black font-mono text-white leading-none tracking-tighter">
                {now.format("HH:mm:ss")}
              </span>
            </div>
            <div className="hidden md:block h-4 w-[1px] bg-white/10"></div>
            <div className="hidden md:flex items-center gap-2 text-white/40">
              <span className="text-[10px] font-mono uppercase">
                {now.format("dddd, DD MMMM YYYY")}
              </span>
            </div>
          </div>
        </div>
        
        {/* Controles + BCV - LadoDer en desktop */}
        <div className="flex flex-col items-start md:items-end gap-3 shrink-0 w-full md:w-auto">
          
          {/* BCV Rate - siempre visible */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-sm">
            <span className="text-[8px] font-black text-amber-500/70 uppercase tracking-wider">BCV:</span>
            <span className="text-[10px] font-mono font-bold text-amber-500">{bcvDisplay}</span>
          </div>
          
          {/* Botones filtros */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 w-full">
            <ButtonGroup
              items={[
                { label: "D", value: "day" },
                { label: "W", value: "week" },
                { label: "M", value: "month" },
              ]}
              selected={range}
              onSelect={(val) => setRange(val as any)}
            />
            <ButtonGroup
              items={[
                { label: "$", value: "USD" },
                { label: "VES", value: "VES" },
              ]}
              selected={currency}
              onSelect={(val) => setCurrency(val as any)}
            />
          </div>
        </div>
      </div>
      
      {/* ✅ LIVE CLOCK - Mobile: solo visible en mobile, debajo de controles */}
      <div className="md:hidden flex items-center justify-between border-t border-white/5 pt-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl font-black font-mono text-white leading-none">
            {now.format("HH:mm:ss")}
          </span>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-mono text-white/60 uppercase">
            {now.format("dddd, DD MMMM YYYY")}
          </div>
          {locationInfo.full && (
            <div className="flex items-center justify-end gap-1 mt-1">
              <MapPinIcon className="w-3 h-3 text-white/30" />
              <span className="text-[8px] font-mono text-white/40">{locationInfo.full}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {metrics &&
          Object.entries(metricsConfig).map(([key, cfg]) => {
            const Icon = cfg.icon;
            const value = metrics[key as keyof typeof metrics] ?? 0;
            
            return (
              <div
                key={key}
                onClick={() => handleMetricClick(cfg.href)}
                className="group relative bg-black/20 border border-white/5 rounded-sm p-3 
                           hover:bg-white/[0.03] cursor-pointer transition-all
                           hover:border-[var(--palantir-active)]/40
                           flex flex-col items-start justify-center gap-2"
              >
                {/* Header: Icon + Label */}
                <div className="flex items-center gap-2 w-full">
                  <div className={`p-1 rounded-sm bg-white/[0.03] border border-white/5 ${cfg.color} group-hover:border-[var(--palantir-active)]/20 transition-colors`}>
                    <Icon className="h-3 w-3" />
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-[0.15em] text-white/40 group-hover:text-white/60 truncate">
                    {getMetricLabel(key)}
                  </span>
                </div>
                
                {/* Value */}
                <div className="text-lg font-mono font-bold tracking-tighter text-white group-hover:text-[var(--palantir-active)] transition-colors">
                  {formatValue(key, value)}
                </div>
                
                {/* Footer: ID + Live Indicator */}
                <div className="flex justify-between items-center w-full pt-1 border-t border-white/[0.03]">
                  <span className="text-[7px] font-mono text-white/20 uppercase tracking-tighter">
                    {key.slice(0, 5)}
                  </span>
                  <div className="flex items-center gap-1">
                    <div className="w-1 h-1 rounded-full bg-emerald-500/50 animate-pulse"></div>
                    <span className="text-[7px] font-mono text-emerald-500/50 uppercase">Live</span>
                  </div>
                </div>
                
                {/* Corner Decorator (Hover Effect) */}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[var(--palantir-active)]/5 rotate-45 translate-x-2 translate-y-2 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform opacity-0 group-hover:opacity-100"></div>
              </div>
            );
          })}
      </div>
    </div>
  );
};
export default ActiveInstitutionCard;