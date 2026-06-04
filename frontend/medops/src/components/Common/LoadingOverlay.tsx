import { ArrowPathIcon } from "@heroicons/react/24/outline";
interface LoadingOverlayProps {
  message?: string;
}
export default function LoadingOverlay({ message = "CARGANDO..." }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-[10000] animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-[#0a0c10]/60 backdrop-blur-md" />
      <div className="relative flex flex-col items-center gap-8">
        
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-emerald-400/20 blur-xl animate-pulse" />
          <ArrowPathIcon 
            className="animate-spin text-emerald-400 relative z-10 w-14 h-14"
            strokeWidth={1.5}
          />
        </div>
        <div className="flex flex-col items-center gap-3">
          <span className="text-lg font-bold text-white tracking-[0.15em] uppercase animate-pulse">
            {message}
          </span>
          
          <div className="flex items-center gap-2">
            <div className="h-[2px] w-10 bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />
            <span className="text-xs font-mono text-white/40 uppercase tracking-widest opacity-60">
              MEDOPZ v2.0
            </span>
            <div className="h-[2px] w-10 bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />
          </div>
        </div>
      </div>
      <div className="absolute top-12 left-12 w-5 h-5 border-t-2 border-l-2 border-white/10" />
      <div className="absolute top-12 right-12 w-5 h-5 border-t-2 border-r-2 border-white/10" />
      <div className="absolute bottom-12 left-12 w-5 h-5 border-b-2 border-l-2 border-white/10" />
      <div className="absolute bottom-12 right-12 w-5 h-5 border-b-2 border-r-2 border-white/10" />
    </div>
  );
}