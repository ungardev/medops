import React from "react";
import { Users, SearchX } from "lucide-react";

interface PatientsEmptyStateProps {
  message?: string;
}

export default function PatientsEmptyState({
  message = "No se encontraron pacientes",
}: PatientsEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-700">
      {/* Icono con contenedor de estilo radar/escaneo */}
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-[var(--palantir-active)]/5 animate-ping duration-[3000ms]" />
        <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-[var(--palantir-border)]/20 border border-[var(--palantir-border)]">
          <Users size={32} className="text-[var(--palantir-muted)] opacity-60" />
          <div className="absolute -bottom-1 -right-1 bg-[var(--palantir-surface)] p-1 rounded-full border border-[var(--palantir-border)]">
            <SearchX size={16} className="text-amber-500/70" />
          </div>
        </div>
      </div>

      {/* Textos con jerarquía operativa */}
      <h3 className="text-xl font-semibold tracking-tight text-white mb-2">
        {message}
      </h3>
      
      <div className="max-w-xs mx-auto">
        <p className="text-sm text-[var(--palantir-muted)] leading-relaxed">
          La consulta no ha devuelto registros activos en la base de datos. 
          Verifica los filtros de búsqueda o procede al registro.
        </p>
      </div>

      {/* Indicador de sistema sutil */}
      <div className="mt-8 flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--palantir-border)]/40 bg-[var(--palantir-border)]/10">
        <div className="w-1 h-1 rounded-full bg-amber-500"></div>
        <span className="text-[9px] font-mono text-[var(--palantir-muted)] uppercase tracking-[0.15em]">
          Database_Empty_Result
        </span>
      </div>
    </div>
  );
}
