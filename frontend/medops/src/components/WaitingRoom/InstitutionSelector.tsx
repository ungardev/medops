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
  if (isLoading) return <div className="h-8 w-32 bg-white/5 animate-pulse rounded-lg border border-white/15" />;
  return (
    <>
      <button
        ref={buttonRef}
        onClick={toggleMenu}
        className={`flex items-center gap-2 px-3 py-2 bg-white/5 border rounded-lg transition-all ${
          isOpen ? 'border-white/25' : 'border-white/15 hover:border-white/25'
        }`}
      >
        <BuildingOfficeIcon className="w-4 h-4 text-white/40" />
        <span className="text-[10px] font-medium text-white/70 truncate max-w-[150px]">
          {activeInstitution?.name || "Seleccionar Institución"}
        </span>
        <ChevronDownIcon className={`w-3 h-3 text-white/30 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && createPortal(
        <>
          <div className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-[1px]" onClick={() => setIsOpen(false)} />
          
          <div 
            style={{ 
              position: 'absolute', 
              top: `${coords.top + 8}px`, 
              left: `${coords.left + coords.width - 280}px`,
              width: '280px' 
            }}
            className="z-[10001] bg-[#1a1a1b] border border-white/15 rounded-lg shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-2 space-y-1">
              <div className="px-3 py-2 text-[9px] text-white/30 border-b border-white/10 mb-1">
                Seleccionar Institución
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {institutions.map((inst: any) => (
                  <button
                    key={inst.id}
                    onClick={() => { setActiveInstitution(inst.id); setIsOpen(false); }}
                    className="flex items-center justify-between w-full px-3 py-2.5 hover:bg-white/5 rounded-lg transition-colors group"
                  >
                    <div className="text-left">
                      <div className="text-[10px] text-white/70 group-hover:text-white/90">
                        {inst.name}
                      </div>
                      <div className="text-[8px] text-white/30">{inst.tax_id}</div>
                    </div>
                    {activeInstitution?.id === inst.id && <CheckIcon className="w-4 h-4 text-emerald-400" />}
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