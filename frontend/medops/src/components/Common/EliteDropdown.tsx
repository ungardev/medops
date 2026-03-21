import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { ChevronDownIcon, CheckIcon } from "@heroicons/react/24/outline";
interface Option {
  id: number;
  name: string;
}
interface EliteDropdownProps {
  options: Option[];
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder: string;
  label: string;
  className?: string;
}
export default function EliteDropdown({ 
  options, 
  value, 
  onChange, 
  placeholder, 
  label, 
  className = "" 
}: EliteDropdownProps) {
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
  const selectedOption = options.find(opt => opt.id === value);
  return (
    <>
      <button
        ref={buttonRef}
        onClick={toggleMenu}
        className={`flex items-center gap-2 px-3 py-1.5 bg-[#1a1a1a] border rounded-sm transition-all ${className} ${
          isOpen ? 'border-white/60 ring-1 ring-white/20' : 'border-white/20 hover:border-white/40'
        }`}
      >
        <span className="text-[10px] font-black uppercase tracking-wider text-white flex-1 text-left truncate">
          {selectedOption?.name || placeholder}
        </span>
        <ChevronDownIcon className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && createPortal(
        <>
          <div className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-[1px]" onClick={() => setIsOpen(false)} />
          <div 
            style={{ 
              position: 'absolute', 
              top: `${coords.top + 8}px`, 
              left: `${coords.left}px`,
              width: `${coords.width}px` 
            }}
            className="z-[10001] bg-[#0d0d0d] border border-white/20 rounded-sm shadow-[0_20px_60px_rgba(0,0,0,1)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-2 space-y-1 bg-[#0d0d0d]">
              <div className="px-3 py-2 text-[9px] font-mono text-white/30 uppercase tracking-[0.2em] border-b border-white/5 mb-1">
                {label}
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {options.length === 0 ? (
                  <div className="px-3 py-2 text-[9px] text-white/30 italic">
                    No hay opciones disponibles
                  </div>
                ) : (
                  options.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => { onChange(opt.id); setIsOpen(false); }}
                      className="flex items-center justify-between w-full px-3 py-2.5 hover:bg-white/10 rounded-sm transition-colors group"
                    >
                      <span className="text-[10px] font-black uppercase text-white/80 group-hover:text-white truncate">
                        {opt.name}
                      </span>
                      {value === opt.id && <CheckIcon className="w-4 h-4 text-emerald-500 shrink-0" />}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}