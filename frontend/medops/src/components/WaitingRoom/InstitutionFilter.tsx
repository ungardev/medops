import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useInstitutions } from "@/hooks/settings/useInstitutions";
import { ChevronDownIcon, XMarkIcon, BuildingOfficeIcon, CheckIcon } from "@heroicons/react/24/outline";

interface Props {
  selectedInstitutionId: number | null;
  onFilterChange: (id: number | null) => void;
  totalInstitution: number;
}

export default function InstitutionFilter({ selectedInstitutionId, onFilterChange, totalInstitution }: Props) {
  const { institutions, isLoading } = useInstitutions();
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  const toggleFilter = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.right + window.scrollX - 280 // Desplazado a la izquierda para alinear a la derecha
      });
    }
    setIsOpen(!isOpen);
  };

  if (isLoading) return <div className="h-6 w-20 bg-white/5 animate-pulse rounded-sm" />;

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          ref={buttonRef}
          onClick={toggleFilter}
          className={`flex items-center gap-2 px-3 py-1.5 border rounded-sm transition-all ${
            selectedInstitutionId 
              ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-500' 
              : 'border-white/10 bg-white/5 text-white/40 hover:border-white/20'
          }`}
        >
          <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          <span className="text-[9px] font-black uppercase tracking-wider">
            {selectedInstitutionId ? institutions.find((i: any) => i.id === selectedInstitutionId)?.name : "All_Institutions"}
          </span>
          {selectedInstitutionId && (
            <XMarkIcon 
              className="w-3 h-3 ml-1 hover:text-white" 
              onClick={(e) => { e.stopPropagation(); onFilterChange(null); }} 
            />
          )}
        </button>
        {selectedInstitutionId && totalInstitution > 0 && (
          <span className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-sm">
            {totalInstitution}
          </span>
        )}
      </div>

      {isOpen && createPortal(
        <>
          <div className="fixed inset-0 z-[10000] bg-black/10" onClick={() => setIsOpen(false)} />
          <div 
            style={{ position: 'absolute', top: `${coords.top + 8}px`, left: `${coords.left}px`, width: '280px' }}
            className="z-[10001] bg-[#0d0d0d] border border-white/20 rounded-sm shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-2 space-y-1 bg-[#0d0d0d]">
              <div className="px-3 py-2 text-[9px] font-mono text-white/30 uppercase tracking-[0.2em] border-b border-white/5 mb-1">
                FILTER_STREAM
              </div>
              <div className="max-h-60 overflow-y-auto">
                <button
                  onClick={() => { onFilterChange(null); setIsOpen(false); }}
                  className="flex items-center justify-between w-full px-3 py-2 hover:bg-white/5 rounded-sm text-[10px] font-black uppercase text-white/40"
                >
                  Clear_Filter
                </button>
                {institutions.map((inst: any) => (
                  <button
                    key={inst.id}
                    onClick={() => { onFilterChange(inst.id); setIsOpen(false); }}
                    className="flex items-center justify-between w-full px-3 py-2 hover:bg-white/5 rounded-sm group"
                  >
                    <span className="text-[10px] font-black uppercase text-white/70 group-hover:text-white truncate pr-4">
                      {inst.name}
                    </span>
                    {selectedInstitutionId === inst.id && <CheckIcon className="w-3.5 h-3.5 text-emerald-500" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}