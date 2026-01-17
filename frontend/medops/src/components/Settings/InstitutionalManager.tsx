// src/components/Settings/InstitutionManager.tsx
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
      alt="Core_Identity_Logo"
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
    return `${API_BASE}${logoStr.startsWith('/') ? '' : '/'}${logoStr}`;
  }, [inst?.logo]);

  if (loading) return (
    <div className="bg-[#080808] border border-white/10 p-8 animate-pulse space-y-6">
      <div className="h-24 bg-white/5 w-24 rounded-sm" />
      <div className="h-12 bg-white/5 w-full rounded-sm" />
    </div>
  );

  return (
    <div className="bg-[#080808] border border-white/10 p-8 rounded-sm backdrop-blur-xl relative overflow-hidden shadow-2xl">
      <div className="absolute top-0 right-0 p-4 opacity-5">
        <CpuChipIcon className="w-24 h-24 text-white" />
      </div>

      <div className="space-y-8">
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
          <div className="w-32 h-32 bg-black border border-white/10 p-4 flex items-center justify-center shadow-inner relative group">
            <StableLogo url={memoizedLogoUrl} />
          </div>
          <div className="flex-1 space-y-5 text-center md:text-left">
            <div>
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-white/30 mb-2 block">Legal_Entity_Name</span>
              <p className="text-xl font-black text-white uppercase tracking-tighter">{inst?.name || "UNNAMED_ENTITY"}</p>
            </div>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <div>
                <span className="text-[9px] font-black uppercase tracking-[0.25em] text-white/30 mb-2 block">Fiscal_UID</span>
                <p className="text-[10px] font-mono text-white/60 bg-white/5 px-3 py-1 border border-white/5">{inst?.tax_id || "NOT_DEFINED"}</p>
              </div>
              {inst?.active_gateway !== 'none' && (
                <div>
                  <span className="text-[9px] font-black uppercase tracking-[0.25em] text-white/30 mb-2 block">Fintech_Engine</span>
                  <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-sm">
                    <BanknotesIcon className="w-3 h-3 text-blue-400" />
                    <span className="text-[10px] font-mono text-blue-400 uppercase">{inst?.active_gateway}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-white/5 pt-8">
          {renderGeodata()}
        </div>

        <button 
          onClick={onEdit} 
          className="w-full flex items-center justify-center gap-3 py-4 border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-[0.3em] text-white/60 hover:text-white transition-all rounded-sm"
        >
          <PencilSquareIcon className="w-4 h-4" /> Open_Identity_Editor
        </button>
      </div>
    </div>
  );
};
