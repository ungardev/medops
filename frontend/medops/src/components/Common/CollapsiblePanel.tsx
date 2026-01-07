// src/components/Common/CollapsiblePanel.tsx
import { useState } from "react";
import { ChevronRightIcon } from "@heroicons/react/20/solid";

interface Props {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export default function CollapsiblePanel({
  title,
  children,
  defaultOpen = true,
}: Props) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-[var(--palantir-border)] bg-white/5 rounded-sm overflow-hidden transition-all duration-300">
      {/* Header Estilo Terminal */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full flex items-center justify-between
          px-4 py-2.5 text-left
          transition-colors duration-200
          ${isOpen ? "bg-white/10 border-b border-[var(--palantir-border)]" : "bg-transparent hover:bg-white/5"}
        `}
      >
        <div className="flex items-center gap-3">
          {/* Indicador de estado visual (Luz de sistema) */}
          <div className={`w-1 h-3 transition-all duration-500 ${
            isOpen 
              ? "bg-[var(--palantir-active)] shadow-[0_0_8px_var(--palantir-active)]" 
              : "bg-white/20"
          }`} />
          
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--palantir-text)]">
            {title}
          </h3>
        </div>

        <div className="flex items-center gap-4">
          {/* Status Label sutil */}
          <span className="hidden sm:inline text-[8px] font-mono text-[var(--palantir-muted)] uppercase tracking-tighter">
            {isOpen ? "MODULE_EXPANDED" : "MODULE_PAUSED"}
          </span>
          
          <ChevronRightIcon
            className={`w-4 h-4 text-[var(--palantir-muted)] transition-transform duration-300 ${
              isOpen ? "rotate-90 text-[var(--palantir-active)]" : "rotate-0"
            }`}
          />
        </div>
      </button>

      {/* Área de Contenido con Animación CSS Nativa */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-4 py-4 animate-in fade-in slide-in-from-top-1 duration-500">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
