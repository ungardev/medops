// src/components/WaitingRoom/InstitutionFilter.tsx
import { useState } from "react";
import { useInstitutions } from "@/hooks/settings/useInstitutions";
import { ChevronDownIcon, XMarkIcon, BuildingOfficeIcon, CheckIcon } from "@heroicons/react/24/outline";

interface InstitutionFilterProps {
  selectedInstitutionId: number | null;
  onFilterChange: (id: number | null) => void;
  totalInstitution: number;
}

export default function InstitutionFilter({ 
  selectedInstitutionId, 
  onFilterChange, 
  totalInstitution 
}: InstitutionFilterProps) {
  const { institutions, isLoading } = useInstitutions();
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (id: number | null) => {
    onFilterChange(id);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evita que se abra/cierre el dropdown al limpiar
    onFilterChange(null);
    setIsOpen(false);
  };

  if (isLoading) {
    return (
      <button className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-sm opacity-50 cursor-not-allowed">
        <BuildingOfficeIcon className="w-4 h-4 text-[var(--palantir-muted)]" />
        <span className="text-[9px] font-black uppercase tracking-wider text-[var(--palantir-text)]">
          Loading...
        </span>
      </button>
    );
  }

  return (
    <div className="relative flex items-center gap-3">
      {/* Botón de filtro principal */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 border rounded-sm transition-all ${
          selectedInstitutionId 
            ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-500' 
            : 'border-white/10 bg-white/5 text-[var(--palantir-muted)] hover:border-white/20'
        }`}
      >
        <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        <span className="text-[9px] font-black uppercase tracking-wider">
          {selectedInstitutionId 
            ? institutions.find((i: any) => i.id === selectedInstitutionId)?.name || "Filtered" 
            : "All Institutions"}
        </span>
        
        {selectedInstitutionId && (
          <div
            onClick={handleClear}
            className="p-0.5 hover:bg-emerald-500/20 rounded-full transition-colors ml-1"
          >
            <XMarkIcon className="w-3 h-3" />
          </div>
        )}
      </button>

      {/* Badge de conteo de pacientes (se muestra si hay un filtro activo) */}
      {selectedInstitutionId && totalInstitution > 0 && (
        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-500 rounded-full text-[9px] font-black">
          {totalInstitution}
        </span>
      )}

      {/* Dropdown de instituciones */}
      {isOpen && (
        <>
          {/* Overlay invisible para cerrar al hacer click fuera */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          
          <div className="absolute top-full left-0 mt-2 w-72 bg-[#0a0a0a] border border-white/10 rounded-sm shadow-2xl z-50">
            <div className="p-2 space-y-1">
              <div className="flex items-center justify-between px-2 py-1.5 border-b border-white/5 mb-1">
                <div className="flex items-center gap-2">
                  <BuildingOfficeIcon className="w-4 h-4 text-white/40" />
                  <span className="text-[9px] font-mono text-white/50 uppercase tracking-widest">
                    Filter by Institution
                  </span>
                </div>
                <button
                  onClick={handleClear}
                  className="text-[8px] font-mono text-white/60 hover:text-white hover:bg-white/10 px-2 py-1 rounded-sm transition-all"
                >
                  Clear
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto custom-scrollbar">
                {institutions.map((inst: any) => (
                  <button
                    key={inst.id}
                    onClick={() => handleSelect(inst.id)}
                    className={`flex items-center gap-2 w-full px-3 py-2 rounded-sm transition-all ${
                      selectedInstitutionId === inst.id 
                        ? 'bg-white/10' 
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <BuildingOfficeIcon className={`w-5 h-5 ${selectedInstitutionId === inst.id ? 'text-emerald-500' : 'text-white/40'}`} />
                    <div className="flex-1 text-left min-w-0">
                      <div className="text-[10px] font-black uppercase tracking-wider text-white truncate">
                        {inst.name}
                      </div>
                      <div className="text-[8px] font-mono text-white/60 uppercase">
                        {inst.tax_id || 'No Tax ID'}
                      </div>
                    </div>
                    {selectedInstitutionId === inst.id && (
                      <CheckIcon className="w-4 h-4 text-emerald-500" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}