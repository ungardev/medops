// src/components/Settings/GeodataDisplay.tsx
import React from "react";
import { MapPinIcon, FingerPrintIcon } from "@heroicons/react/24/outline";

interface GeodataDisplayProps {
  neighborhood: any;
  address: string;
}

export const GeodataDisplay = ({ neighborhood, address }: GeodataDisplayProps) => {
  const isPopulated = neighborhood && typeof neighborhood === 'object' && neighborhood.parish;

  return (
    <>
      <div className="space-y-2">
        <span className="flex items-center gap-2 text-[8px] font-mono text-white/20 uppercase tracking-[0.2em]">
          <MapPinIcon className="w-3 h-3" /> Node_Hierarchy
        </span>
        <div className="text-[10px] font-mono text-white/80 leading-relaxed uppercase bg-black/20 p-4 border border-white/5 rounded-sm min-h-[80px]">
          {!isPopulated ? (
            <span className="text-red-500/50 italic font-bold">GEODATA_NOT_SYNCED</span>
          ) : (
            <div className="space-y-1">
              <p className="opacity-40">{neighborhood.parish.municipality?.state?.country?.name || "VENEZUELA"}</p>
              <p className="opacity-60">{neighborhood.parish.municipality?.state?.name}</p>
              <p className="font-bold text-emerald-500/80">
                {neighborhood.parish.municipality?.name} / {neighborhood.parish.name}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <span className="flex items-center gap-2 text-[8px] font-mono text-white/20 uppercase tracking-[0.2em]">
          <FingerPrintIcon className="w-3 h-3" /> Address_Vector
        </span>
        <div className="text-[10px] font-mono text-white/80 leading-relaxed uppercase bg-black/20 p-4 border border-white/5 rounded-sm min-h-[80px]">
          <p className="text-white font-bold opacity-70">
            [{neighborhood?.name || 'N/A'}]
          </p>
          <p className="mt-2 italic text-white/40">{address || "STREET_DATA_MISSING"}</p>
        </div>
      </div>
    </>
  );
};
