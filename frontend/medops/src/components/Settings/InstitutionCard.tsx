// src/components/Settings/InstitutionCard.tsx
import React from "react";
import { 
  BuildingOfficeIcon, 
  MapPinIcon, 
  CheckBadgeIcon,
  PencilIcon,
  TrashIcon
} from "@heroicons/react/24/outline";
interface InstitutionCardProps {
  name: string;
  taxId: string;
  logoUrl: string | null;
  address: string;
  neighborhoodName?: string; 
  isActive: boolean;
  onEdit: () => void;
  onSelect?: () => void;
  onDelete?: () => void;
}
export const InstitutionCard = ({ 
  name, 
  taxId, 
  logoUrl, 
  address, 
  neighborhoodName = "N/A",
  isActive, 
  onEdit,
  onSelect,
  onDelete
}: InstitutionCardProps) => {
  return (
    <div className="group relative bg-[#0A0A0A] border border-white/5 p-6 hover:border-emerald-500/30 transition-all duration-500 shadow-xl">
      
      {/* Iconos de acción en esquina superior derecha */}
      <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
        {onEdit && (
          <button 
            onClick={onEdit}
            className="p-1.5 text-white/30 hover:text-white hover:bg-white/10 rounded-sm transition-all"
            title="Edit"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
        )}
        {onDelete && (
          <button 
            onClick={onDelete}
            className="p-1.5 text-red-500/30 hover:text-red-500 hover:bg-red-500/10 rounded-sm transition-all"
            title="Delete"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {/* Indicador de Estado */}
      <div className={`absolute top-0 right-0 w-1 h-full`} />
      
      <div className="flex gap-6">
        {/* Logo Slot - fondo blanco para visibilidad del logo */}
        <div className="w-20 h-20 bg-white border border-gray-200 flex items-center justify-center p-2 shrink-0 overflow-hidden">
          {logoUrl ? (
            <img 
              src={logoUrl} 
              // ✅ FIX: Quitado grayscale para que el logo sea visible
              className="max-h-full object-contain transition-all" 
              alt="logo" 
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <BuildingOfficeIcon className="w-8 h-8 text-gray-300" />
          )}
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-black text-white uppercase truncate tracking-widest">{name}</h4>
            {isActive && <CheckBadgeIcon className="w-4 h-4 text-emerald-500/50" />}
          </div>
          
          <div className="space-y-3">
            <div>
              <span className="text-[8px] font-mono text-white/20 uppercase tracking-tighter">Fiscal_UID:</span>
              <p className="text-[10px] font-mono text-white/60">{taxId || "PENDING_REGISTRATION"}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[8px] font-mono text-white/20 uppercase">Vector_Node:</span>
                <p className="text-[9px] text-emerald-500/60 font-bold truncate">[{neighborhoodName}]</p>
              </div>
              <div>
                <span className="text-[8px] font-mono text-white/20 uppercase">Identity_Status:</span>
                <p className={`text-[9px] font-black `}>
                  {isActive ? 'OPERATIONAL' : 'DEACTIVATED'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer del Card */}
      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white/20">
          <MapPinIcon className="w-3 h-3" />
          <span className="text-[9px] font-mono truncate max-w-[200px]">{address}</span>
        </div>
        
        {/* Botón Set_Active simplificado */}
        {onSelect && !isActive && (
          <button 
            onClick={onSelect}
            className="text-[9px] font-black uppercase text-emerald-500/50 hover:text-emerald-500 transition-colors tracking-widest"
          >
            Set_Active
          </button>
        )}
      </div>
    </div>
  );
};