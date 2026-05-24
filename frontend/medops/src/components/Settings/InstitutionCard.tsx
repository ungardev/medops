// src/components/Settings/InstitutionCard.tsx
import React from "react";
import { 
  BuildingOfficeIcon, 
  MapPinIcon, 
  CheckBadgeIcon
} from "@heroicons/react/24/outline";
interface InstitutionCardProps {
  name: string;
  taxId: string;
  institution?: any;
  address: string;
  neighborhoodName?: string; 
  isActive: boolean;
  onSelect?: () => void;
}
export const InstitutionCard = ({ 
  name, 
  taxId, 
  institution,
  address, 
  neighborhoodName = "N/A",
  isActive, 
  onSelect
}: InstitutionCardProps) => {
  const hasLogo = institution?.logo && typeof institution.logo === 'string';
  
  return (
    <div className="relative bg-white/5 border border-white/15 p-6 transition-all duration-300 shadow-sm rounded-lg">
      
      {isActive && (
        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-400 rounded-l-lg" />
      )}
      
      <div className="flex gap-5">
        <div className="w-20 h-20 bg-white/5 border border-white/15 flex items-center justify-center p-2 shrink-0 overflow-hidden rounded-lg">
          {hasLogo ? (
            <img 
              src={institution.logo}
              className="max-h-full max-w-full object-contain transition-all" 
              alt="logo"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <BuildingOfficeIcon className="w-8 h-8 text-white/20" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <h4 className="text-sm font-medium text-white/90 truncate">{name}</h4>
            {isActive && <CheckBadgeIcon className="w-4 h-4 text-emerald-400/60" />}
          </div>
          
          <div className="space-y-2">
            <div>
              <span className="text-[9px] text-white/30 uppercase">RIF:</span>
              <p className="text-[10px] text-white/50">{taxId || "N/A"}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[9px] text-white/30 uppercase">Ubicación:</span>
                <p className="text-[10px] text-emerald-400/70 truncate">[{neighborhoodName}]</p>
              </div>
              <div>
                <span className="text-[9px] text-white/30 uppercase">Estado:</span>
                <p className="text-[10px] font-medium">
                  {isActive ? 'Activa' : 'Desactivada'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white/20">
          <MapPinIcon className="w-3.5 h-3.5" />
          <span className="text-[9px] truncate max-w-[200px]">{address}</span>
        </div>
        
        {onSelect && !isActive && (
          <button 
            onClick={onSelect}
            className="text-[10px] font-medium text-emerald-400/60 hover:text-emerald-400 transition-colors"
          >
            Activar
          </button>
        )}
      </div>
    </div>
  );
};