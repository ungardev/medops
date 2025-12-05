// src/components/Consultation/ResponsivePanel.tsx
import { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/solid";

interface ResponsivePanelProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

/**
 * ResponsivePanel
 * - Mobile y Tablet: muestra un bloque con pestañita superior derecha para expandir/contraer.
 * - Desktop: NO se usa, la versión desktop queda intacta y sagrada.
 */
export default function ResponsivePanel({
  title,
  children,
  defaultExpanded = false,
}: ResponsivePanelProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="lg:hidden border border-gray-200 dark:border-gray-700 rounded-md">
      {/* Header con título y pestañita */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-t-md">
        <h4 className="text-sm font-semibold text-[#0d2c53] dark:text-white">
          {title}
        </h4>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-gray-500 dark:text-gray-300 hover:text-[#0d2c53] dark:hover:text-white"
          aria-label={expanded ? "Contraer" : "Expandir"}
        >
          {expanded ? (
            <ChevronUpIcon className="w-4 h-4" />
          ) : (
            <ChevronDownIcon className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Contenido expandible */}
      {expanded && <div className="px-4 py-3">{children}</div>}
    </div>
  );
}
