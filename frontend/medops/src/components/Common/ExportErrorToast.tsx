// src/components/Common/ExportErrorToast.tsx
import { useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { XCircleIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
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
        } max-w-md w-full bg-[#1a1a1b] border border-red-500/20 shadow-lg pointer-events-auto flex flex-col rounded-lg`}
      >
        <div className="flex items-center gap-2 px-4 py-3 bg-red-500/5 border-b border-red-500/20">
          <XCircleIcon className="w-4 h-4 text-red-400" />
          <span className="text-[10px] font-medium text-red-400">
            Error al generar documentos
          </span>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <ExclamationTriangleIcon className="w-3 h-3 text-red-400/60" />
            <span className="text-[8px] font-medium text-red-400/60">Errores encontrados:</span>
          </div>
          
          <ul className="space-y-2">
            {errors.map((err, idx) => (
              <li key={idx} className="flex flex-col border-l border-red-500/20 pl-3">
                <span className="text-[9px] font-medium text-red-400/80">
                  {err.category}
                </span>
                <span className="text-[10px] text-red-400/60 leading-tight">
                  {err.error}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex border-t border-red-500/20">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full py-2.5 text-[10px] font-medium text-red-400/70 hover:bg-red-500/10 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    ), { duration: 8000 });
    hasShown.current = true;
    onClose();
  }, [errors, onClose]);
  return null;
}