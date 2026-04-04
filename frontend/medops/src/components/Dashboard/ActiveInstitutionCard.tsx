// src/components/Dashboard/ActiveInstitutionCard.tsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
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
    color: "text-blue-400",
    href: "/appointments",
  },
  pending_count: {
    label: "Pendientes",
    icon: ClockIcon,
    color: "text-amber-400",
    href: "/appointments?status=pending",
  },
  waiting_count: {
    label: "En Espera",
    icon: ClockIcon,
    color: "text-purple-400",
    href: "/waitingroom",
  },
  in_consultation_count: {
    label: "En Consulta",
    icon: ClipboardIcon,
    color: "text-indigo-400",
    href: "/consultation",
  },
  completed_count: {
    label: "Finalizadas",
    icon: CheckCircleIcon,
    color: "text-emerald-400",
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
    color: "text-emerald-400",
    href: "/payments",
  },
  exempted_count: {
    label: "Exonerados",
    icon: CurrencyDollarIcon,
    color: "text-red-400",
    href: "/payments",
  },
};
export const ActiveInstitutionCard: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { range, setRange, currency, setCurrency } = useDashboardFilters();
  
  const { data: activeData, isLoading } = useActiveInstitution({ range, currency });
  const { data: bcvRate } = useBCVRate();
  const { data: locationData } = usePublicInstitutionLocation();
  
  const [now, setNow] = useState(moment());
  const [isUpdating, setIsUpdating] = useState(false);
  
  useEffect(() => {
    const timer = setInterval(() => setNow(moment()), 1000);
    return () => clearInterval(timer);
  }, []);
  
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
  
  const handleUpdateBCVRate = async () => {
    setIsUpdating(true);
    try {
      localStorage.removeItem('bcv_rate');
      await queryClient.invalidateQueries({ queryKey: ['bcv-rate'] });
    } catch (error) {
      console.error('Error actualizando tasa BCV:', error);
    } finally {
      setIsUpdating(false);
    }
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
      <div className="bg-white/5 border border-white/15 p-6 rounded-lg">
        <div className="flex gap-5 mb-6">
          <div className="w-16 h-16 bg-white/5 border border-white/15 flex items-center justify-center shrink-0 rounded-lg">
            <div className="w-8 h-8 bg-white/10 animate-pulse rounded" />
          </div>
          <div className="flex-1">
            <div className="h-4 bg-white/10 rounded w-48 mb-2 animate-pulse" />
            <div className="h-3 bg-white/5 rounded w-32 animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-4 animate-pulse">
              <div className="h-3 bg-white/10 rounded w-16 mb-2" />
              <div className="h-5 bg-white/5 rounded w-12" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (!institution) {
    return (
      <div className="bg-white/5 border border-white/15 p-6 rounded-lg">
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <BuildingOfficeIcon className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/50 text-sm">No hay institución activa</p>
            <button 
              onClick={handleConfigure}
              className="mt-3 text-[11px] font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Configurar Institución
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  const bcvDisplay = bcvRate 
    ? `${Number(bcvRate.rate).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs/USD`
    : "--";
  
  return (
    <div className="bg-white/5 border border-white/15 p-6 rounded-lg">
      
      <div className="flex flex-col md:flex-row items-start gap-5 mb-6">
        
        <div className="w-16 h-16 bg-white border border-gray-200 flex items-center justify-center p-2 shrink-0 overflow-hidden mx-auto md:mx-0 rounded-lg">
          {typeof institution.logo === 'string' ? (
            <img 
              src={institution.logo} 
              className="max-h-full object-contain filter grayscale hover:grayscale-0 transition-all duration-300" 
              alt={`${institution.name} logo`} 
            />
          ) : (
            <BuildingOfficeIcon className="w-8 h-8 text-gray-400" />
          )}
        </div>
        
        <div className="flex-1 min-w-0 w-full">
          <div className="flex items-center gap-3 flex-wrap">
            <h4 className="text-lg font-semibold text-white truncate">
              {institution.name}
            </h4>
            
            <div className="flex items-center gap-2">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </div>
              <span className="text-[9px] font-medium text-emerald-400 uppercase tracking-wider">Activa</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            <div className="flex items-center gap-2">
              <button onClick={handleConfigure} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors">
                <CogIcon className="w-4 h-4 text-white/40 hover:text-white/60" />
              </button>
              <span className="text-[9px] font-medium text-white/50">RIF:</span>
              <p className="text-[10px] font-medium text-white/70">{institution.tax_id || "Pendiente"}</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-4 mt-3">
            <div className="flex items-center gap-2">
              <span className="text-xl font-semibold text-white leading-none">
                {now.format("HH:mm:ss")}
              </span>
            </div>
            <div className="h-4 w-[1px] bg-white/10"></div>
            <div className="flex items-center gap-2 text-white/50">
              <span className="text-[10px] font-medium">
                {now.format("dddd, DD MMMM YYYY")}
              </span>
            </div>
            {locationInfo.full && locationInfo.full !== "Sin ubicación" && (
              <>
                <div className="h-4 w-[1px] bg-white/10"></div>
                <div className="flex items-center gap-1.5 text-white/50">
                  <MapPinIcon className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-medium">{locationInfo.full}</span>
                </div>
              </>
            )}
          </div>
        </div>
        
        <div className="flex flex-col items-start md:items-end gap-3 shrink-0 w-full md:w-auto">
          
          <div 
            className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg cursor-pointer hover:bg-amber-500/15 transition-colors"
            onClick={handleUpdateBCVRate}
            title="Actualizar tasa BCV"
          >
            <span className="text-[9px] font-medium text-amber-400/70">BCV:</span>
            <span className="text-[10px] font-semibold text-amber-400">{bcvDisplay}</span>
            {isUpdating && <span className="ml-1 animate-spin text-[10px]">⏳</span>}
          </div>
          
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 w-full">
            <ButtonGroup
              items={[
                { label: "Día", value: "day" },
                { label: "Semana", value: "week" },
                { label: "Mes", value: "month" },
              ]}
              selected={range}
              onSelect={(val) => setRange(val as any)}
            />
            <ButtonGroup
              items={[
                { label: "USD", value: "USD" },
                { label: "Bs.", value: "VES" },
              ]}
              selected={currency}
              onSelect={(val) => setCurrency(val as any)}
            />
          </div>
        </div>
      </div>
      
      <div className="md:hidden flex items-center justify-between border-t border-white/10 pt-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl font-semibold text-white leading-none">
            {now.format("HH:mm:ss")}
          </span>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-medium text-white/50">
            {now.format("dddd, DD MMMM YYYY")}
          </div>
          {locationInfo.full && locationInfo.full !== "Sin ubicación" && (
            <div className="flex items-center justify-end gap-1.5 mt-1">
              <MapPinIcon className="w-3.5 h-3.5 text-white/30" />
              <span className="text-[9px] font-medium text-white/50">{locationInfo.full}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {metrics &&
          Object.entries(metricsConfig).map(([key, cfg]) => {
            const Icon = cfg.icon;
            const value = metrics[key as keyof typeof metrics] ?? 0;
            
            return (
              <div
                key={key}
                onClick={() => handleMetricClick(cfg.href)}
                className="group relative bg-white/5 border border-white/10 rounded-lg p-4 
                           hover:bg-white/10 cursor-pointer transition-all
                           hover:border-white/20
                           flex flex-col items-start justify-center gap-2"
              >
                <div className="flex items-center gap-2.5 w-full">
                  <div className={`p-2 rounded-lg bg-white/5 border border-white/10 ${cfg.color} group-hover:border-white/20 transition-colors`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-medium text-white/60 group-hover:text-white/80 truncate">
                    {getMetricLabel(key)}
                  </span>
                </div>
                
                <div className="text-xl font-semibold tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                  {formatValue(key, value)}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};
export default ActiveInstitutionCard;