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
  CalendarIcon,
  ArrowPathIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";
import { useDashboardFilters } from "@/context/DashboardFiltersContext";
import { useActiveInstitution } from "@/hooks/dashboard/useActiveInstitution";
import { useBCVRate } from "@/hooks/dashboard/useBCVRate";
import { usePublicInstitutionLocation } from "@/hooks/settings/usePublicInstitutionLocation";
import ButtonGroup from "@/components/Common/ButtonGroup";
import { getInstitutionLogoUrl } from "@/utils/institutionLogo";
import moment from "moment";

const metricsConfig = {
  scheduled_count: {
    label: "Agendadas",
    icon: ClipboardIcon,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    hoverBorderColor: "hover:border-blue-500/40",
    category: "operational",
    href: "/appointments",
  },
  pending_count: {
    label: "Pendientes",
    icon: ClockIcon,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    hoverBorderColor: "hover:border-amber-500/40",
    category: "operational",
    href: "/appointments?status=pending",
  },
  waiting_count: {
    label: "En Espera",
    icon: UserGroupIcon,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    hoverBorderColor: "hover:border-purple-500/40",
    category: "operational",
    href: "/waitingroom",
  },
  in_consultation_count: {
    label: "En Consulta",
    icon: DocumentTextIcon,
    color: "text-indigo-400",
    bgColor: "bg-indigo-500/10",
    borderColor: "border-indigo-500/20",
    hoverBorderColor: "hover:border-indigo-500/40",
    category: "operational",
    href: "/consultation",
  },
  completed_count: {
    label: "Finalizadas",
    icon: CheckCircleIcon,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    hoverBorderColor: "hover:border-emerald-500/40",
    category: "operational",
    href: "/appointments?status=completed",
  },
  total_amount: {
    label: "Total ($)",
    icon: CurrencyDollarIcon,
    color: "text-white",
    bgColor: "bg-white/5",
    borderColor: "border-white/15",
    hoverBorderColor: "hover:border-white/25",
    category: "financial",
    href: "/payments",
  },
  payments_count: {
    label: "Pagos",
    icon: CurrencyDollarIcon,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    hoverBorderColor: "hover:border-emerald-500/40",
    category: "financial",
    href: "/payments",
  },
  exempted_count: {
    label: "Exonerados",
    icon: ExclamationTriangleIcon,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
    hoverBorderColor: "hover:border-red-500/40",
    category: "financial",
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
  const [bcvLastUpdated, setBcvLastUpdated] = useState<Date | null>(null);
  
  useEffect(() => {
    const timer = setInterval(() => setNow(moment()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  useEffect(() => {
    if (bcvRate) {
      setBcvLastUpdated(new Date());
    }
  }, [bcvRate]);
  
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
      setBcvLastUpdated(new Date());
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
      <div className="bg-white/5 sm:border sm:border-white/15 p-4 sm:p-6 lg:p-8 sm:rounded-xl">
        <div className="flex gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white/5 border border-white/15 flex items-center justify-center shrink-0 rounded-xl">
            <div className="w-12 h-12 bg-white/10 animate-pulse rounded" />
          </div>
          <div className="flex-1">
            <div className="h-8 bg-white/10 rounded w-48 sm:w-64 mb-3 animate-pulse" />
            <div className="h-5 bg-white/5 rounded w-32 sm:w-48 animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-white/10 rounded w-16 sm:w-20 mb-3" />
              <div className="h-8 bg-white/5 rounded w-12 sm:w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (!institution) {
    return (
      <div className="bg-white/5 sm:border sm:border-white/15 p-4 sm:p-6 lg:p-8 sm:rounded-xl">
        <div className="flex items-center justify-center h-40">
          <div className="text-center">
            <BuildingOfficeIcon className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <p className="text-lg text-white/60 mb-4">No hay institución activa</p>
            <button 
              onClick={handleConfigure}
              className="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
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
    <div className="bg-white/5 sm:border sm:border-white/15 p-4 sm:p-6 lg:p-8 sm:rounded-xl">
      
      {/* Header: Logo + Info + Clock */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-4 sm:mb-6">
        
        {/* Logo */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto sm:mx-0 bg-white border border-gray-200 flex items-center justify-center p-3 shrink-0 overflow-hidden rounded-xl shadow-inner">
          {institution.logo && typeof institution.logo === 'string' ? (
            <img 
              src={getInstitutionLogoUrl(institution.logo)} 
              className="max-h-full max-w-full object-contain" 
              alt={`${institution.name} logo`} 
            />
          ) : (
            <BuildingOfficeIcon className="w-12 h-12 text-gray-400" />
          )}
        </div>
        
        {/* Institution Info */}
        <div className="flex-1 min-w-0 w-full">
          <div className="flex items-center gap-4 flex-wrap mb-3">
            <h2 className="text-2xl font-bold text-white">
              {institution.name}
            </h2>
            
            <div className="flex items-center gap-2">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
              </div>
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Activa</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 mb-4">
            <button onClick={handleConfigure} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
              <CogIcon className="w-5 h-5 text-white/50 hover:text-white/70" />
            </button>
            <span className="text-sm font-medium text-white/60">RIF:</span>
            <span className="text-sm font-semibold text-white/80">{institution.tax_id || "Pendiente"}</span>
          </div>
          
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-white leading-none">
                {now.format("HH:mm:ss")}
              </span>
            </div>
            <div className="h-6 w-[1px] bg-white/10"></div>
            <div className="flex items-center gap-2 text-white/70">
              <CalendarIcon className="w-4 h-4" />
              <span className="text-sm font-medium">
                {now.format("dddd, DD MMMM YYYY")}
              </span>
            </div>
            {locationInfo.full && locationInfo.full !== "Sin ubicación" && (
              <>
                <div className="h-6 w-[1px] bg-white/10"></div>
                <div className="flex items-center gap-2 text-white/70">
                  <MapPinIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">{locationInfo.full}</span>
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* BCV Rate + Mobile Time - Compact */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 sm:gap-4 shrink-0 w-full sm:w-auto">
          {/* Mobile: compact time + BCV inline */}
          <div className="sm:hidden flex items-center gap-3">
            <span className="text-xl font-bold text-white">
              {now.format("HH:mm")}
            </span>
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <span className="text-sm font-bold text-amber-400">{bcvDisplay}</span>
              <button 
                onClick={handleUpdateBCVRate}
                className="p-1 hover:bg-amber-500/20 rounded transition-colors"
                title="Actualizar tasa"
              >
                <ArrowPathIcon className={`w-4 h-4 text-amber-400/70 ${isUpdating ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
          {/* Desktop: BCV prominent */}
          <div className="hidden sm:flex flex-col items-end gap-3">
            <div className="flex items-center gap-3 px-5 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-amber-400/70 uppercase tracking-wider">BCV</span>
                <span className="text-lg font-bold text-amber-400">{bcvDisplay}</span>
              </div>
              <button 
                onClick={handleUpdateBCVRate}
                className="p-2 hover:bg-amber-500/20 rounded-lg transition-colors"
                title="Actualizar tasa"
              >
                <ArrowPathIcon className={`w-5 h-5 text-amber-400/70 ${isUpdating ? 'animate-spin' : ''}`} />
              </button>
            </div>
            {bcvLastUpdated && (
              <span className="text-xs text-amber-400/50">
                Actualizado hace {moment(bcvLastUpdated).fromNow()}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Selectors */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-white/10">
        <ButtonGroup
          items={[
            { label: "Dia", value: "day" },
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
                className={`
                  group relative bg-white/5 border rounded-xl p-4 
                  hover:bg-white/10 cursor-pointer transition-all duration-300
                  hover:scale-[1.02] hover:shadow-xl
                  ${cfg.borderColor} ${cfg.hoverBorderColor}
                `}
              >
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <div className={`p-1.5 sm:p-2.5 rounded-lg ${cfg.bgColor}`}>
                    <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${cfg.color}`} />
                  </div>
                  <span className="text-[10px] sm:text-xs font-semibold text-white/70 uppercase tracking-wider truncate">
                    {getMetricLabel(key)}
                  </span>
                </div>
                
                <div className="text-2xl font-bold text-white tracking-tight">
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