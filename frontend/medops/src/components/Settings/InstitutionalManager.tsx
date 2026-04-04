// src/components/Settings/InstitutionalManager.tsx
import React, { useMemo } from "react";
import { 
  BuildingOfficeIcon, 
  CpuChipIcon, 
  BanknotesIcon, 
  PencilSquareIcon 
} from "@heroicons/react/24/outline";
import { memo, useState, useEffect } from "react";
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const StableLogo = memo(({ url }: { url: string | null }) => {
  const [imgSrc, setImgSrc] = useState<string>(url || "/logo-placeholder.svg");
  
  useEffect(() => {
    const targetUrl = url || "/logo-placeholder.svg";
    if (targetUrl !== imgSrc) setImgSrc(targetUrl);
  }, [url]);
  
  return (
    <img 
      src={imgSrc} 
      className="max-h-full object-contain filter grayscale brightness-125 contrast-125 hover:grayscale-0 transition-all duration-700" 
      alt="Logo de la institución"
      onError={(e) => { (e.target as HTMLImageElement).src = "/logo-placeholder.svg"; }}
    />
  );
});
interface InstitutionManagerProps {
  inst: any;
  loading: boolean;
  onEdit: () => void;
  renderGeodata: () => React.ReactNode;
}
export const InstitutionManager = ({ inst, loading, onEdit, renderGeodata }: InstitutionManagerProps) => {
  const memoizedLogoUrl = useMemo(() => {
    if (!inst?.logo) return null;
    if (inst.logo instanceof File) return URL.createObjectURL(inst.logo);
    const logoStr = String(inst.logo);
    
    if (logoStr.startsWith('http') || logoStr.startsWith('blob:')) return logoStr;
    
    const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000')
      .replace(/\/api\/?$/, '');
    
    const cleanLogoStr = logoStr.startsWith('/') ? logoStr : `/${logoStr}`;
    
    return `${baseUrl}${cleanLogoStr}`;
  }, [inst?.logo]);
  if (loading) return (
    <div className="bg-white/5 border border-white/15 p-8 animate-pulse space-y-6 rounded-lg">
      <div className="h-24 bg-white/5 w-24 rounded-lg" />
      <div className="h-12 bg-white/5 w-full rounded-lg" />
    </div>
  );
  return (
    <div className="bg-white/5 border border-white/15 p-8 rounded-lg backdrop-blur-xl relative overflow-hidden shadow-sm">
      <div className="absolute top-0 right-0 p-4 opacity-5">
        <CpuChipIcon className="w-24 h-24 text-white" />
      </div>
      
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
          <div className="w-32 h-32 bg-white/5 border border-white/15 p-4 flex items-center justify-center shadow-inner relative group rounded-lg">
            <StableLogo url={memoizedLogoUrl} />
          </div>
          
          <div className="flex-1 space-y-5 text-center md:text-left">
            <div>
              <span className="text-[10px] font-medium text-white/30 uppercase tracking-wider mb-2 block">Nombre Legal</span>
              <p className="text-xl font-semibold text-white/90">{inst?.name || "Sin nombre"}</p>
            </div>
            
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <div>
                <span className="text-[10px] font-medium text-white/30 uppercase tracking-wider mb-2 block">RIF</span>
                <p className="text-[11px] text-white/50 bg-white/5 px-3 py-1.5 border border-white/10 rounded-lg">{inst?.tax_id || "N/A"}</p>
              </div>
              
              {inst?.active_gateway !== 'none' && (
                <div>
                  <span className="text-[10px] font-medium text-white/30 uppercase tracking-wider mb-2 block">Pasarela de Pago</span>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <BanknotesIcon className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-[11px] text-blue-400/80">{inst?.active_gateway}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-white/10 pt-8">
          {renderGeodata()}
        </div>
        
        <button 
          onClick={onEdit} 
          className="w-full flex items-center justify-center gap-2 py-3 border border-white/15 bg-white/5 hover:bg-white/10 text-[11px] font-medium text-white/50 hover:text-white/80 transition-all rounded-lg"
        >
          <PencilSquareIcon className="w-4 h-4" /> Editar Institución
        </button>
      </div>
    </div>
  );
};