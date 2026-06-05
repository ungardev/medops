// src/components/Doctor/DoctorProfileCard.tsx
import React from 'react';
import type { Doctor } from '@/api/patient/client';
import { CheckCircleIcon, BuildingOfficeIcon, UserIcon, EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { Mail } from 'lucide-react';

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
    <div className="bg-white/5 border border-white/15 rounded-xl p-6 w-full max-w-md">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 flex items-center justify-center overflow-hidden flex-shrink-0">
          {doctor.photo_url ? (
            <img src={doctor.photo_url} alt={doctor.full_name} className="w-full h-full object-cover" />
          ) : (
            <UserIcon className="w-10 h-10 text-emerald-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-5 bg-emerald-400/60 rounded-full shrink-0" />
            <h3 className="text-white font-semibold text-xl truncate">{doctor.full_name}</h3>
            {doctor.is_verified && (
              <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-xs font-medium shrink-0">
                VERIFICADO
              </span>
            )}
          </div>
          <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md uppercase tracking-wide">
            {doctor.specialties?.map(s => s.name).join(', ')}
          </span>
          <div className="flex items-center gap-2 text-white/40 text-xs mt-2">
            <BuildingOfficeIcon className="w-3.5 h-3.5" />
            <span>{doctor.institutions?.[0]?.name || 'Institución no especificada'}</span>
          </div>
        </div>
      </div>
      
      {doctor.bio && (
        <div className="mb-6 pt-4 border-t border-white/10">
          <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Biografía</h4>
          <p className="text-white/70 text-sm leading-relaxed">{doctor.bio}</p>
        </div>
      )}
      
      {!isPreview && (
        <div className="mb-6 pt-4 border-t border-white/10">
          <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Datos de Contacto</h4>
          <div className="space-y-3">
            {doctor.email && (
              <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                <div className="w-9 h-9 bg-emerald-500/10 rounded-lg flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-white/40">Email</p>
                  <p className="text-sm text-white/70 truncate">{doctor.email}</p>
                </div>
              </div>
            )}
            {doctor.phone && (
              <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                <div className="w-9 h-9 bg-emerald-500/10 rounded-lg flex items-center justify-center shrink-0">
                  <PhoneIcon className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-white/40">Teléfono</p>
                  <p className="text-sm text-white/70">{doctor.phone}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {!isPreview && onPurchase && (
        <div className="mt-6">
          <button
            onClick={() => onPurchase(0)}
            className="w-full py-3 bg-emerald-500 text-white text-sm font-semibold rounded-lg hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
          >
            Ver Servicios y Comprar
          </button>
        </div>
      )}
      
      {isPreview && (
        <div className="mt-4 text-center">
          <span className="text-white/20 text-xs">
            MODO PREVISUALIZACIÓN
          </span>
        </div>
      )}
    </div>
  );
};