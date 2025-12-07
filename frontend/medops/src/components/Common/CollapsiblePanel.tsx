// src/components/Common/CollapsiblePanel.tsx
import { useState } from "react";
import { ChevronDown } from "lucide-react";

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
    <div
      className="
        border border-gray-200 dark:border-gray-700 rounded-md
        bg-white dark:bg-gray-900
      "
    >
      {/* Header compacto con pestañita */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="
          w-full flex items-center justify-between
          px-3 py-2 sm:px-4 sm:py-2.5
          text-left
          bg-gray-50 dark:bg-gray-800
          rounded-t-md
        "
      >
        <h3 className="text-sm sm:text-base font-semibold text-[#0d2c53] dark:text-gray-100">
          {title}
        </h3>
        <ChevronDown
          className={`w-4 h-4 text-[#0d2c53] dark:text-gray-100 transition-transform ${
            isOpen ? "rotate-0" : "-rotate-90"
          }`}
        />
      </button>

      {/* Contenido con transición suave */}
      <div
        className={`transition-all duration-300 ${
          isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        } overflow-hidden`}
      >
        <div className="px-3 py-3 sm:px-4 sm:py-4">
          {children}
        </div>
      </div>
    </div>
  );
}
