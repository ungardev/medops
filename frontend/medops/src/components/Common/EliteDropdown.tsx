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
        className={`flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/15 rounded-lg transition-all ${className} ${
          isOpen ? 'border-white/25' : 'hover:border-white/25'
        }`}
      >
        <span className="text-[10px] font-medium text-white/70 flex-1 text-left truncate">
          {selectedOption?.name || placeholder}
        </span>
        <ChevronDownIcon className={`w-3 h-3 text-white/30 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && createPortal(
        <>
          <div className="fixed inset-0 z-[10000]" onClick={() => setIsOpen(false)} />
          <div 
            style={{ 
              position: 'absolute', 
              top: `${coords.top + 8}px`, 
              left: `${coords.left}px`,
              width: `${coords.width}px` 
            }}
            className="z-[10001] bg-[#1a1a1b] border border-white/15 rounded-lg shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-2 space-y-1">
              <div className="px-3 py-2 text-[9px] text-white/30 border-b border-white/10 mb-1">
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
                      className="flex items-center justify-between w-full px-3 py-2.5 hover:bg-white/5 rounded-lg transition-colors group"
                    >
                      <span className="text-[10px] text-white/60 group-hover:text-white/90 truncate">
                        {opt.name}
                      </span>
                      {value === opt.id && <CheckIcon className="w-4 h-4 text-emerald-400 shrink-0" />}
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