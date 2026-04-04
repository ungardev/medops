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
        left: rect.right + window.scrollX - 280
      });
    }
    setIsOpen(!isOpen);
  };
  if (isLoading) return <div className="h-6 w-20 bg-white/5 animate-pulse rounded-lg" />;
  return (
    <>
      <div className="flex items-center gap-2">
        <button
          ref={buttonRef}
          onClick={toggleFilter}
          className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg transition-all ${
            selectedInstitutionId 
              ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400' 
              : 'border-white/15 bg-white/5 text-white/40 hover:border-white/25'
          }`}
        >
          <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          <span className="text-[9px] font-medium truncate max-w-[120px]">
            {selectedInstitutionId ? institutions.find((i: any) => i.id === selectedInstitutionId)?.name : "Todas"}
          </span>
          {selectedInstitutionId && (
            <XMarkIcon 
              className="w-3 h-3 ml-1 hover:text-white/70" 
              onClick={(e) => { e.stopPropagation(); onFilterChange(null); }} 
            />
          )}
        </button>
        {selectedInstitutionId && totalInstitution > 0 && (
          <span className="text-[9px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
            {totalInstitution}
          </span>
        )}
      </div>
      {isOpen && createPortal(
        <>
          <div className="fixed inset-0 z-[10000]" onClick={() => setIsOpen(false)} />
          <div 
            style={{ position: 'absolute', top: `${coords.top + 8}px`, left: `${coords.left}px`, width: '280px' }}
            className="z-[10001] bg-[#1a1a1b] border border-white/15 rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-2 space-y-1">
              <div className="px-3 py-2 text-[9px] text-white/30 border-b border-white/10 mb-1">
                Filtrar por institución
              </div>
              <div className="max-h-60 overflow-y-auto">
                <button
                  onClick={() => { onFilterChange(null); setIsOpen(false); }}
                  className="flex items-center justify-between w-full px-3 py-2 hover:bg-white/5 rounded-lg text-[10px] text-white/40 hover:text-white/70"
                >
                  Todas las instituciones
                </button>
                {institutions.map((inst: any) => (
                  <button
                    key={inst.id}
                    onClick={() => { onFilterChange(inst.id); setIsOpen(false); }}
                    className="flex items-center justify-between w-full px-3 py-2 hover:bg-white/5 rounded-lg group"
                  >
                    <span className="text-[10px] text-white/60 group-hover:text-white/90 truncate pr-4">
                      {inst.name}
                    </span>
                    {selectedInstitutionId === inst.id && <CheckIcon className="w-3.5 h-3.5 text-emerald-400" />}
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