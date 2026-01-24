// src/components/WaitingRoom/InstitutionSelector.tsx
import { useState } from "react";
import { useInstitutions } from "@/hooks/settings/useInstitutions";
import { BuildingOfficeIcon, ChevronDownIcon, CheckIcon } from "@heroicons/react/24/outline";
export default function InstitutionSelector() {
  const { institutions, activeInstitution, setActiveInstitution, isLoading } = useInstitutions();
  const [isOpen, setIsOpen] = useState(false);
  const handleSelect = async (id: number) => {
    await setActiveInstitution(id);
    setIsOpen(false);
  };
  if (isLoading) {
    return (
      <button className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-sm opacity-50 cursor-not-allowed backdrop-blur-sm">
        <BuildingOfficeIcon className="w-5 h-5 text-[var(--palantir-muted)]" />
        <span className="text-[10px] font-black uppercase tracking-wider text-[var(--palantir-text)]">
          Loading...
        </span>
      </button>
    );
  }
  return (
    <>
      {/* Overlay para bloquear mouse cuando abierto */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setIsOpen(false)} />
      )}
      <div className="relative z-50">
        {/* Botón opaco */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/20 rounded-sm hover:border-emerald-500/30 hover:bg-white/20 transition-all backdrop-blur-md opacity-90"
        >
          {activeInstitution?.logo && typeof activeInstitution.logo === 'string' ? (
            <img src={activeInstitution.logo} className="w-5 h-5 object-contain" alt="logo" />
          ) : (
            <BuildingOfficeIcon className="w-5 h-5 text-[var(--palantir-muted)]" />
          )}
          <span className="text-[10px] font-black uppercase tracking-wider text-[var(--palantir-text)]">
            {activeInstitution?.name || "Select Institution"}
          </span>
          <ChevronDownIcon className="w-4 h-4 text-[var(--palantir-muted)]" />
        </button>
        {/* Dropdown encima del overlay */}
        {isOpen && (
          <div className="absolute top-full right-0 mt-1 w-80 bg-black/95 border border-white/20 rounded-sm shadow-2xl z-50 backdrop-blur-lg">
            <div className="p-2 space-y-1">
              <div className="text-[9px] font-mono text-white/50 uppercase tracking-widest border-b border-white/5 pb-2">
                Switch Institution
              </div>
              {institutions.map((inst: any) => (
                <button
                  key={inst.id}
                  onClick={() => handleSelect(inst.id)}
                  className="flex items-center gap-2 w-full px-3 py-2 hover:bg-white/10 rounded-sm transition-all"
                >
                  {inst.logo && typeof inst.logo === 'string' ? (
                    <img src={inst.logo} className="w-6 h-6 object-contain" alt="logo" />
                  ) : (
                    <BuildingOfficeIcon className="w-6 h-6 text-white/40" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-black uppercase tracking-wider text-white">
                      {inst.name}
                    </div>
                    <div className="text-[8px] font-mono text-white/60 uppercase">
                      {inst.tax_id}
                    </div>
                  </div>
                  {activeInstitution?.id === inst.id && (
                    <CheckIcon className="w-4 h-4 text-emerald-500" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}