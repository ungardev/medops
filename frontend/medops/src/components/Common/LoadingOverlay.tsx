import { Loader2 } from "lucide-react";

interface LoadingOverlayProps {
  message?: string;
}

export default function LoadingOverlay({ message = "Procesando solicitud..." }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-[10000] animate-in fade-in duration-300">
      {/* Fondo con desenfoque cinematográfico */}
      <div className="absolute inset-0 bg-[#0a0c10]/60 backdrop-blur-md" />

      {/* Contenedor de carga estilo Palantir */}
      <div className="relative flex flex-col items-center gap-6">
        
        {/* Spinner animado con aura de luz */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-[var(--palantir-active)]/20 blur-xl animate-pulse" />
          <Loader2 
            className="animate-spin text-[var(--palantir-active)] relative z-10" 
            size={48} 
            strokeWidth={1.5}
          />
        </div>

        {/* Mensaje y decoraciones técnicas */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-sm font-bold text-white tracking-[0.2em] uppercase animate-pulse">
            {message}
          </span>
          
          <div className="flex items-center gap-1.5">
            <div className="h-[2px] w-8 bg-gradient-to-r from-transparent via-[var(--palantir-active)]/50 to-transparent" />
            <span className="text-[9px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest opacity-60">
              System_Executing
            </span>
            <div className="h-[2px] w-8 bg-gradient-to-r from-transparent via-[var(--palantir-active)]/50 to-transparent" />
          </div>
        </div>
      </div>

      {/* Esquinas decorativas de la interfaz (opcional, para look OS) */}
      <div className="absolute top-10 left-10 w-4 h-4 border-t-2 border-l-2 border-white/10" />
      <div className="absolute top-10 right-10 w-4 h-4 border-t-2 border-r-2 border-white/10" />
      <div className="absolute bottom-10 left-10 w-4 h-4 border-b-2 border-l-2 border-white/10" />
      <div className="absolute bottom-10 right-10 w-4 h-4 border-b-2 border-r-2 border-white/10" />
    </div>
  );
}
