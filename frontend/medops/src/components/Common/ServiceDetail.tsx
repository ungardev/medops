// src/components/Common/ServiceDetail.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { DoctorService } from '@/api/patient/client';
import { 
  XIcon, 
  UserIcon, 
  Building2Icon, 
  ClockIcon, 
  FileTextIcon,
  CalendarIcon
} from 'lucide-react';
interface ServiceDetailProps {
  service: DoctorService;
  onClose: () => void;
  onBuy: () => void;
}
export const ServiceDetail: React.FC<ServiceDetailProps> = ({
  service,
  onClose,
  onBuy
}) => {
  const hasValidDoctor = service.doctor && service.doctor > 0;
  return (
    <div className="bg-[#1a1a1b] border border-white/15 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
            <FileTextIcon className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-white/80 font-medium text-base leading-tight">{service.name}</h3>
            <span className="text-[9px] text-blue-400/70 bg-blue-500/10 px-2 py-0.5 rounded-md">
              {service.category_name || 'Servicio'}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white/30 hover:text-white/60 p-2 hover:bg-white/5 rounded-lg transition-colors"
        >
          <XIcon className="w-5 h-5" />
        </button>
      </div>
      
      <div className="p-5 space-y-4">
        {hasValidDoctor ? (
          <Link 
            to={`/patient/doctor/${service.doctor}`} 
            className="flex items-center gap-3 bg-white/5 p-3 rounded-lg hover:bg-white/10 transition-colors"
          >
            <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center shrink-0">
              <UserIcon className="w-5 h-5 text-white/40" />
            </div>
            <div className="min-w-0">
              <p className="text-white/70 text-sm font-medium truncate">
                Dr. {service.doctor_name || 'Médico no especificado'}
              </p>
              <p className="text-white/30 text-xs">Especialista Principal</p>
            </div>
          </Link>
        ) : (
          <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg">
            <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center shrink-0">
              <UserIcon className="w-5 h-5 text-white/40" />
            </div>
            <div className="min-w-0">
              <p className="text-white/70 text-sm font-medium truncate">
                {service.doctor_name || 'Médico no especificado'}
              </p>
              <p className="text-white/30 text-xs">Especialista Principal</p>
            </div>
          </div>
        )}
        
        <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg">
          <Building2Icon className="w-5 h-5 text-white/30 shrink-0" />
          <div className="min-w-0">
            <p className="text-white/60 text-sm truncate">
              {service.institution_name || 'Institución no especificada'}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 p-3 rounded-lg flex items-center gap-2">
            <ClockIcon className="w-4 h-4 text-white/30" />
            <div>
              <p className="text-white/20 text-[9px]">Duración</p>
              <p className="text-white/60 text-xs">
                {service.duration_minutes ? `${service.duration_minutes} min` : 'N/A'}
              </p>
            </div>
          </div>
          <div className="bg-white/5 p-3 rounded-lg flex items-center gap-2">
            <FileTextIcon className="w-4 h-4 text-white/30" />
            <div>
              <p className="text-white/20 text-[9px]">Código</p>
              <p className="text-white/60 text-xs font-mono">
                {service.code}
              </p>
            </div>
          </div>
        </div>
        
        {service.description && (
          <div className="bg-white/5 p-3 rounded-lg">
            <p className="text-white/50 text-xs leading-relaxed">
              {service.description}
            </p>
          </div>
        )}
        
        <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-lg text-center mt-4">
          <p className="text-emerald-400/60 text-[9px] uppercase tracking-wider mb-1">Precio del servicio</p>
          <p className="text-emerald-400 text-2xl font-semibold">
            $ {service.price_usd ? service.price_usd.toLocaleString('en-US', { minimumFractionDigits: 2 }) : 'N/A'}
          </p>
        </div>
      </div>
      
      <div className="flex gap-3 p-5 border-t border-white/10">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 bg-white/5 text-white/60 text-[10px] font-medium rounded-lg hover:bg-white/10 transition-colors"
        >
          Volver
        </button>
        <button
          onClick={onBuy}
          className="flex-1 py-2.5 bg-emerald-500/15 text-emerald-400 text-[10px] font-medium rounded-lg hover:bg-emerald-500/25 flex items-center justify-center gap-2 transition-colors border border-emerald-500/25"
        >
          <CalendarIcon className="w-4 h-4" />
          Comprar Ahora
        </button>
      </div>
    </div>
  );
};