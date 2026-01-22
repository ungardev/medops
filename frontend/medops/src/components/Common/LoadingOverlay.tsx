import { ArrowPathIcon } from "@heroicons/react/24/outline";
interface LoadingOverlayProps {
  message?: string;
}
export default function LoadingOverlay({ message = "PROCESSING_DATA_STREAM..." }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-[10000] animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-[#0a0c10]/60 backdrop-blur-md" />
      <div className="relative flex flex-col items-center gap-6">
        
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-[var(--palantir-active)]/20 blur-xl animate-pulse" />
          <ArrowPathIcon 
            className="animate-spin text-[var(--palantir-active)] relative z-10 w-12 h-12"
            strokeWidth={1.5}
          />
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-sm font-bold text-white tracking-[0.2em] uppercase animate-pulse">
            {message}
          </span>
          
          <div className="flex items-center gap-1.5">
            <div className="h-[2px] w-8 bg-gradient-to-r from-transparent via-[var(--palantir-active)]/50 to-transparent" />
            <span className="text-[9px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest opacity-60">
              PROTOCOL_EXECUTION_IN_PROGRESS
            </span>
            <div className="h-[2px] w-8 bg-gradient-to-r from-transparent via-[var(--palantir-active)]/50 to-transparent" />
          </div>
        </div>
      </div>
      <div className="absolute top-10 left-10 w-4 h-4 border-t-2 border-l-2 border-white/10" />
      <div className="absolute top-10 right-10 w-4 h-4 border-t-2 border-r-2 border-white/10" />
      <div className="absolute bottom-10 left-10 w-4 h-4 border-b-2 border-l-2 border-white/10" />
      <div className="absolute bottom-10 right-10 w-4 h-4 border-b-2 border-r-2 border-white/10" />
    </div>
  );
}