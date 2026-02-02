// src/components/Dashboard/ActiveInstitutionCard.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import {
  BuildingOfficeIcon,
  UserGroupIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CogIcon,
  ChartBarIcon
} from "@heroicons/react/24/outline";
import { InstitutionSettings } from "@/types/config";
interface ActiveInstitutionCardProps {
  institution?: InstitutionSettings | null;
  metrics?: {
    patients_today: number;
    appointments_today: number;
    payments_today: number;
    pending_payments: number;
  };
  isLoading?: boolean;
}
export const ActiveInstitutionCard: React.FC<ActiveInstitutionCardProps> = ({
  institution,
  metrics,
  isLoading = false
}) => {
  const navigate = useNavigate();
  
  if (isLoading) {
    return (
      <div className="group relative bg-[#0A0A0A] border border-white/5 p-6 hover:border-emerald-500/30 transition-all duration-500 shadow-xl">
        {/* Loading Skeleton */}
        <div className="flex gap-6">
          <div className="w-20 h-20 bg-black border border-white/10 flex items-center justify-center p-2 shrink-0">
            <div className="w-8 h-8 bg-white/10 animate-pulse rounded" />
          </div>
          <div className="flex-1">
            <div className="h-4 bg-white/10 rounded w-48 mb-2 animate-pulse" />
            <div className="h-3 bg-white/5 rounded w-32 animate-pulse" />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-black/20 border border-white/5 rounded-sm p-3 animate-pulse">
              <div className="h-3 bg-white/10 rounded w-16 mb-1" />
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
              onClick={() => navigate("/settings/config")}
              className="mt-3 text-[10px] font-black uppercase text-emerald-500 hover:text-emerald-400 transition-colors tracking-widest"
            >
              Configurar Institución //
            </button>
          </div>
        </div>
      </div>
    );
  }
  const metricsData = metrics || {
    patients_today: 0,
    appointments_today: 0,
    payments_today: 0,
    pending_payments: 0
  };
  const handleConfigure = () => {
    navigate("/settings/config");
  };
  const handleViewDetails = () => {
    // Por ahora navegamos a institutions, después se puede crear una vista detallada
    navigate("/settings/config");
  };
  return (
    <div className="group relative bg-[#0A0A0A] border border-white/5 p-6 hover:border-emerald-500/30 transition-all duration-500 shadow-xl">
      
      {/* Header: Logo + Nombre + Status */}
      <div className="flex gap-6 mb-6">
        {/* Logo */}
        <div className="w-20 h-20 bg-black border border-white/10 flex items-center justify-center p-2 shrink-0 overflow-hidden">
          {typeof institution.logo === 'string' ? (
            <img 
              src={institution.logo} 
              className="max-h-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300" 
              alt={`${institution.name} logo`} 
            />
          ) : (
            <BuildingOfficeIcon className="w-8 h-8 text-white/10" />
          )}
        </div>
        
        {/* Institution Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
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
          
          <div className="mt-2">
            <span className="text-[8px] font-mono text-white/20 uppercase tracking-tighter">Fiscal_UID:</span>
            <p className="text-[10px] font-mono text-white/60">{institution.tax_id || "PENDING_REGISTRATION"}</p>
          </div>
        </div>
      </div>
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Patients Today */}
        <div className="bg-black/20 border border-white/5 rounded-sm p-3 hover:bg-white/[0.03] transition-all group/metric">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1 rounded-sm bg-white/[0.03] border border-white/5 text-blue-600 dark:text-blue-400 group-hover/metric:border-blue-500/20 transition-colors">
              <UserGroupIcon className="h-3 w-3" />
            </div>
            <span className="text-[8px] font-black uppercase tracking-[0.15em] text-white/40">Pacientes Hoy</span>
          </div>
          <div className="text-lg font-mono font-bold tracking-tighter text-white group-hover/metric:text-blue-500 transition-colors">
            {metricsData.patients_today.toLocaleString()}
          </div>
        </div>
        {/* Appointments Today */}
        <div className="bg-black/20 border border-white/5 rounded-sm p-3 hover:bg-white/[0.03] transition-all group/metric">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1 rounded-sm bg-white/[0.03] border border-white/5 text-purple-600 dark:text-purple-400 group-hover/metric:border-purple-500/20 transition-colors">
              <CalendarIcon className="h-3 w-3" />
            </div>
            <span className="text-[8px] font-black uppercase tracking-[0.15em] text-white/40">Citas Hoy</span>
          </div>
          <div className="text-lg font-mono font-bold tracking-tighter text-white group-hover/metric:text-purple-500 transition-colors">
            {metricsData.appointments_today.toLocaleString()}
          </div>
        </div>
        {/* Payments Today */}
        <div className="bg-black/20 border border-white/5 rounded-sm p-3 hover:bg-white/[0.03] transition-all group/metric">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1 rounded-sm bg-white/[0.03] border border-white/5 text-green-600 dark:text-green-400 group-hover/metric:border-green-500/20 transition-colors">
              <CurrencyDollarIcon className="h-3 w-3" />
            </div>
            <span className="text-[8px] font-black uppercase tracking-[0.15em] text-white/40">Pagos Hoy</span>
          </div>
          <div className="text-lg font-mono font-bold tracking-tighter text-white group-hover/metric:text-green-500 transition-colors">
            {metricsData.payments_today.toLocaleString()}
          </div>
        </div>
        {/* Pending Payments */}
        <div className="bg-black/20 border border-white/5 rounded-sm p-3 hover:bg-white/[0.03] transition-all group/metric">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1 rounded-sm bg-white/[0.03] border border-white/5 text-yellow-600 dark:text-yellow-400 group-hover/metric:border-yellow-500/20 transition-colors">
              <ClockIcon className="h-3 w-3" />
            </div>
            <span className="text-[8px] font-black uppercase tracking-[0.15em] text-white/40">Pendientes</span>
          </div>
          <div className="text-lg font-mono font-bold tracking-tighter text-white group-hover/metric:text-yellow-500 transition-colors">
            {metricsData.pending_payments.toLocaleString()}
          </div>
        </div>
      </div>
      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <div className="flex items-center gap-3">
          <button 
            onClick={handleConfigure}
            className="text-[9px] font-black uppercase text-white/40 hover:text-white transition-colors tracking-widest"
          >
            Configurar //
          </button>
          
          <button 
            onClick={handleViewDetails}
            className="text-[9px] font-black uppercase text-emerald-500/50 hover:text-emerald-500 transition-colors tracking-widest"
          >
            Ver Detalles //
          </button>
        </div>
        
        {/* Corner Decorator (Solo visible en hover) */}
        <div className="w-4 h-4 bg-emerald-500/5 rotate-45 translate-x-2 translate-y-2 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform opacity-0 group-hover:opacity-100" />
      </div>
    </div>
  );
};
export default ActiveInstitutionCard;