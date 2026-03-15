// src/components/Doctor/DoctorProfileCard.tsx
import React from 'react';
import type { Doctor } from '@/api/patient/client';
import { CheckCircleIcon, MapPinIcon, BuildingOfficeIcon, UserIcon } from '@heroicons/react/24/outline';
interface DoctorProfileCardProps {
  doctor: Doctor;
  mode?: 'view' | 'preview';
  onPurchase?: (serviceId: number) => void;
}
export const DoctorProfileCard: React.FC<DoctorProfileCardProps> = ({
  doctor,
  mode = 'view',
  onPurchase,
}) => {
  const isPreview = mode === 'preview';
  return (
    <div className="bg-[#0a0a0b] border border-white/10 rounded-sm p-6 w-full max-w-md">
      {/* Header con Foto y Nombre */}
      <div className="flex items-start gap-4 mb-6">
        <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
          {doctor.photo_url ? (
            <img src={doctor.photo_url} alt={doctor.full_name} className="w-full h-full object-cover" />
          ) : (
            <UserIcon className="w-10 h-10 text-white/50" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-white font-bold text-lg truncate">{doctor.full_name}</h3>
            {doctor.is_verified && (
              <CheckCircleIcon className="w-5 h-5 text-emerald-400 flex-shrink-0" title="Médico Verificado" />
            )}
          </div>
          <p className="text-white/60 text-sm mb-2">
            {doctor.specialties?.map(s => s.name).join(', ')}
          </p>
          <div className="flex items-center gap-2 text-white/40 text-xs">
            <BuildingOfficeIcon className="w-3 h-3" />
            <span>{doctor.institutions?.[0]?.name || 'Institución no especificada'}</span>
          </div>
        </div>
      </div>
      {/* Biografía */}
      {doctor.bio && (
        <div className="mb-6">
          <h4 className="text-white/80 text-xs font-mono uppercase tracking-wider mb-2">Biografía</h4>
          <p className="text-white/70 text-sm leading-relaxed">{doctor.bio}</p>
        </div>
      )}
      {/* Datos de Contacto (Solo en modo vista) */}
      {!isPreview && (
        <div className="mb-6 pt-4 border-t border-white/10">
          <h4 className="text-white/80 text-xs font-mono uppercase tracking-wider mb-3">Datos de Contacto</h4>
          <div className="space-y-2 text-sm">
            {doctor.email && (
              <div className="flex items-center gap-2 text-white/60">
                <span className="text-white/40">Email:</span>
                <span>{doctor.email}</span>
              </div>
            )}
            {doctor.phone && (
              <div className="flex items-center gap-2 text-white/60">
                <span className="text-white/40">Teléfono:</span>
                <span>{doctor.phone}</span>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Acciones */}
      {!isPreview && onPurchase && (
        <div className="mt-6">
          <button
            onClick={() => onPurchase(0)} // Placeholder, se manejará en la página
            className="w-full py-3 bg-white text-black text-[10px] font-black uppercase tracking-wider rounded-sm hover:bg-white/90 transition-colors"
          >
            Ver Servicios y Comprar
          </button>
        </div>
      )}
      {/* Indicador de Previsualización */}
      {isPreview && (
        <div className="mt-4 text-center">
          <span className="text-white/30 text-xs font-mono">
            MODO PREVISUALIZACIÓN
          </span>
        </div>
      )}
    </div>
  );
};