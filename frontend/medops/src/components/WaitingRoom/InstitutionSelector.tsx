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
      <button className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1a1a] border border-white/20 rounded-sm opacity-50 cursor-not-allowed">
        <BuildingOfficeIcon className="w-5 h-5 text-[var(--palantir-muted)]" />
        <span className="text-[10px] font-black uppercase tracking-wider text-[var(--palantir-text)]">
          Loading...
        </span>
      </button>
    );
  }
  return (
    <>
      {/* OVERLAY: Ahora con z-[9998] para asegurar que esté por encima de TODO excepto el dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] cursor-default"
          onClick={(e) => {
            e.stopPropagation(); // Detiene el click para que no llegue al fondo
            setIsOpen(false);
          }}
        />
      )}
      {/* CONTENEDOR RELATIVO: Subimos el z-index para que el dropdown gane la batalla */}
      <div className="relative z-[9999]">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-3 py-1.5 bg-[#1a1a1a] border rounded-sm transition-all duration-200 ${
            isOpen ? 'border-white/60 ring-1 ring-white/20' : 'border-white/20 hover:border-white/40'
          }`}
        >
          {activeInstitution?.logo && typeof activeInstitution.logo === 'string' ? (
            <img src={activeInstitution.logo} className="w-5 h-5 object-contain" alt="logo" />
          ) : (
            <BuildingOfficeIcon className="w-5 h-5 text-[var(--palantir-muted)]" />
          )}
          <span className="text-[10px] font-black uppercase tracking-wider text-[var(--palantir-text)]">
            {activeInstitution?.name || "Select Institution"}
          </span>
          <ChevronDownIcon className={`w-4 h-4 text-[var(--palantir-muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {/* DROPDOWN MENU */}
        {isOpen && (
          <div 
            className="absolute top-full right-0 mt-2 w-80 bg-[#0d0d0d] border border-white/20 rounded-sm shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] overflow-hidden"
            onClick={(e) => e.stopPropagation()} // IMPORTANTE: Evita que el click dentro del menú cierre el menú
          >
            <div className="p-2 space-y-1 bg-[#0d0d0d]"> {/* Reforzamos el color de fondo aquí */}
              <div className="px-3 py-2 text-[9px] font-mono text-white/40 uppercase tracking-[0.2em] border-b border-white/5 mb-1">
                Switch Institution
              </div>
              
              <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                {institutions.map((inst: any) => (
                  <button
                    key={inst.id}
                    onClick={() => handleSelect(inst.id)}
                    className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-white/10 rounded-sm transition-colors group text-left"
                  >
                    <div className="relative flex-shrink-0">
                      {inst.logo && typeof inst.logo === 'string' ? (
                        <img src={inst.logo} className="w-6 h-6 object-contain" alt="logo" />
                      ) : (
                        <BuildingOfficeIcon className="w-6 h-6 text-white/20 group-hover:text-white/40" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-black uppercase tracking-wider text-white/90 group-hover:text-white">
                        {inst.name}
                      </div>
                      <div className="text-[8px] font-mono text-white/40 uppercase">
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
          </div>
        )}
      </div>
    </>
  );
}