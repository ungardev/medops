// src/components/Common/ExportErrorToast.tsx
import { useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { XCircleIcon, CommandLineIcon } from "@heroicons/react/24/outline";

interface ExportErrorToastProps {
  errors: { category: string; error: string }[];
  onClose: () => void;
}

export default function ExportErrorToast({ errors, onClose }: ExportErrorToastProps) {
  const hasShown = useRef(false);

  useEffect(() => {
    if (hasShown.current) return;

    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-in fade-in slide-in-from-top-4' : 'animate-out fade-out slide-out-to-top-4'
        } max-w-md w-full bg-[#1a0a0a] border border-red-900/50 shadow-[0_0_20px_rgba(153,27,27,0.2)] pointer-events-auto flex flex-col`}
      >
        {/* HEADER DEL ERROR */}
        <div className="flex items-center gap-2 px-4 py-2 bg-red-950/40 border-b border-red-900/30">
          <XCircleIcon className="w-4 h-4 text-red-500" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-400">
            DOCUMENT_GENERATION_FAILURE
          </span>
        </div>

        {/* LISTA DE ERRORES ESTILO LOG */}
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <CommandLineIcon className="w-3 h-3 text-red-800" />
            <span className="text-[8px] font-mono text-red-800 uppercase">Stack_Trace_Summary:</span>
          </div>
          
          <ul className="space-y-2">
            {errors.map((err, idx) => (
              <li key={idx} className="flex flex-col border-l border-red-900/50 pl-3">
                <span className="text-[9px] font-black text-red-500 uppercase tracking-tighter">
                  {err.category.replace(/\s+/g, '_')}
                </span>
                <span className="text-[10px] font-mono text-red-200/70 leading-tight">
                  {err.error.toUpperCase()}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* ACCIÓN DE CIERRE */}
        <div className="flex border-t border-red-900/30">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full py-2 text-[9px] font-black uppercase tracking-widest text-red-400 hover:bg-red-500/10 transition-colors"
          >
            TERMINATE_ERROR_REPORT [ESC]
          </button>
        </div>
      </div>
    ), { duration: 8000 });

    hasShown.current = true;
    onClose();
  }, [errors, onClose]);

  return null;
}
