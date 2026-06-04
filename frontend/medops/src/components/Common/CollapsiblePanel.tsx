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
    <div className="border border-white/15 bg-white/5 rounded-xl overflow-hidden transition-all duration-300">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full flex items-center justify-between
          px-6 py-4 text-left
          transition-colors duration-200
          ${isOpen ? "bg-white/10 border-b border-white/15" : "bg-transparent hover:bg-white/5"}
        `}
      >
        <div className="flex items-center gap-4">
          <div className={`w-1.5 h-5 rounded-full transition-all duration-300 ${
            isOpen ? "bg-emerald-400" : "bg-white/20"
          }`} />
          <h3 className="text-base font-semibold text-white">
            {title}
          </h3>
        </div>
        <ChevronRightIcon
          className={`w-5 h-5 text-white/50 transition-transform duration-300 ${
            isOpen ? "rotate-90 text-emerald-400" : "rotate-0"
          }`}
        />
      </button>
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-6 py-5 animate-in fade-in slide-in-from-top-1 duration-300">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}