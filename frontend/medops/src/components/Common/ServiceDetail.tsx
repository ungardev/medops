// src/components/Common/ServiceDetail.tsx
import React from 'react';
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
  return (
    <div className="bg-[#0a0a0b] border border-white/20 rounded-sm overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/20 bg-black/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
            <FileTextIcon className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg leading-tight">{service.name}</h3>
            <span className="text-[10px] font-mono text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">
              {service.category_name || 'SERVICIO'}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <XIcon className="w-5 h-5" />
        </button>
      </div>
      {/* Contenido */}
      <div className="p-5 space-y-4">
        {/* Doctor */}
        <div className="flex items-center gap-3 bg-black/30 p-3 rounded-sm border border-white/10">
          <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center shrink-0">
            <UserIcon className="w-5 h-5 text-white/70" />
          </div>
          <div className="min-w-0">
            <p className="text-white/90 text-sm font-medium truncate">
              Dr. {service.doctor_name || 'Médico no especificado'}
            </p>
            <p className="text-white/50 text-xs">Especialista Principal</p>
          </div>
        </div>
        {/* Institución */}
        <div className="flex items-center gap-3 bg-black/30 p-3 rounded-sm border border-white/10">
          <Building2Icon className="w-5 h-5 text-white/70 shrink-0" />
          <div className="min-w-0">
            <p className="text-white/80 text-sm truncate">
              {service.institution_name || 'Institución no especificada'}
            </p>
          </div>
        </div>
        {/* Detalles Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-black/30 p-3 rounded-sm flex items-center gap-2 border border-white/10">
            <ClockIcon className="w-4 h-4 text-blue-400" />
            <div>
              <p className="text-white/50 text-[9px]">Duración</p>
              <p className="text-white/80 text-xs">
                {service.duration_minutes ? `${service.duration_minutes} min` : 'N/A'}
              </p>
            </div>
          </div>
          <div className="bg-black/30 p-3 rounded-sm flex items-center gap-2 border border-white/10">
            <FileTextIcon className="w-4 h-4 text-blue-400" />
            <div>
              <p className="text-white/50 text-[9px]">Código</p>
              <p className="text-white/80 text-xs font-mono">
                {service.code}
              </p>
            </div>
          </div>
        </div>
        {/* Descripción */}
        {service.description && (
          <div className="bg-black/30 p-3 rounded-sm border border-white/10">
            <p className="text-white/60 text-xs leading-relaxed">
              {service.description}
            </p>
          </div>
        )}
        {/* Precio Destacado */}
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-sm text-center mt-4">
          <p className="text-emerald-400/80 text-[10px] uppercase tracking-widest mb-1">Precio del servicio</p>
          <p className="text-emerald-400 text-3xl font-black">
            $ {service.price_usd ? service.price_usd.toLocaleString('en-US', { minimumFractionDigits: 2 }) : 'N/A'}
          </p>
        </div>
      </div>
      {/* Footer */}
      <div className="flex gap-3 p-4 border-t border-white/20 bg-black/40">
        <button
          onClick={onClose}
          className="flex-1 py-3 bg-white/10 text-white text-[11px] font-black uppercase tracking-wider rounded-sm hover:bg-white/20 transition-colors"
        >
          Volver
        </button>
        <button
          onClick={onBuy}
          className="flex-1 py-3 bg-emerald-500 text-black text-[11px] font-black uppercase tracking-wider rounded-sm hover:bg-emerald-400 flex items-center justify-center gap-2 transition-colors"
        >
          <CalendarIcon className="w-4 h-4" />
          Comprar Ahora
        </button>
      </div>
    </div>
  );
};