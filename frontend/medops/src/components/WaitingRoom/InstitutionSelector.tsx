import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useInstitutions } from "@/hooks/settings/useInstitutions";
import { BuildingOfficeIcon, ChevronDownIcon, CheckIcon } from "@heroicons/react/24/outline";

export default function InstitutionSelector() {
  const { institutions, activeInstitution, setActiveInstitution, isLoading } = useInstitutions();
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  const toggleMenu = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
    setIsOpen(!isOpen);
  };

  if (isLoading) return <div className="h-8 w-32 bg-white/5 animate-pulse rounded-sm border border-white/10" />;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={toggleMenu}
        className={`flex items-center gap-2 px-3 py-1.5 bg-[#1a1a1a] border rounded-sm transition-all ${
          isOpen ? 'border-white/60 ring-1 ring-white/20' : 'border-white/20 hover:border-white/40'
        }`}
      >
        <BuildingOfficeIcon className="w-4 h-4 text-[var(--palantir-muted)]" />
        <span className="text-[10px] font-black uppercase tracking-wider text-white">
          {activeInstitution?.name || "Select Institution"}
        </span>
        <ChevronDownIcon className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && createPortal(
        <>
          {/* Bloqueador de Fondo: Detiene clics y añade un ligero oscurecimiento */}
          <div className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-[1px]" onClick={() => setIsOpen(false)} />
          
          <div 
            style={{ 
              position: 'absolute', 
              top: `${coords.top + 8}px`, 
              left: `${coords.left + coords.width - 280}px`,
              width: '280px' 
            }}
            className="z-[10001] bg-[#0d0d0d] border border-white/20 rounded-sm shadow-[0_20px_60px_rgba(0,0,0,1)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-2 space-y-1 bg-[#0d0d0d]">
              <div className="px-3 py-2 text-[9px] font-mono text-white/30 uppercase tracking-[0.2em] border-b border-white/5 mb-1">
                INSTITUTION_TERMINAL
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {institutions.map((inst: any) => (
                  <button
                    key={inst.id}
                    onClick={() => { setActiveInstitution(inst.id); setIsOpen(false); }}
                    className="flex items-center justify-between w-full px-3 py-2.5 hover:bg-white/10 rounded-sm transition-colors group"
                  >
                    <div className="text-left">
                      <div className="text-[10px] font-black uppercase text-white/80 group-hover:text-white">
                        {inst.name}
                      </div>
                      <div className="text-[8px] font-mono text-white/30 italic">{inst.tax_id}</div>
                    </div>
                    {activeInstitution?.id === inst.id && <CheckIcon className="w-4 h-4 text-emerald-500" />}
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