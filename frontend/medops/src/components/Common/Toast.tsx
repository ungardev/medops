// src/components/Common/Toast.tsx
import { useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  InformationCircleIcon 
} from "@heroicons/react/24/outline";

interface ToastProps {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  const hasShown = useRef(false);

  useEffect(() => {
    if (hasShown.current) return;

    // Configuración de estilos por tipo
    const config = {
      success: {
        icon: <CheckCircleIcon className="w-5 h-5 text-[var(--palantir-active)]" />,
        className: "border-l-4 border-[var(--palantir-active)]",
        prefix: "SYS_OK"
      },
      error: {
        icon: <ExclamationCircleIcon className="w-5 h-5 text-red-500" />,
        className: "border-l-4 border-red-600",
        prefix: "SYS_ERR"
      },
      info: {
        icon: <InformationCircleIcon className="w-5 h-5 text-blue-400" />,
        className: "border-l-4 border-blue-500",
        prefix: "SYS_MSG"
      }
    };

    const current = config[type] || config.info;

    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-in fade-in slide-in-from-right-5' : 'animate-out fade-out slide-out-to-right-5'
        } max-w-md w-full bg-[#1a1a1a] shadow-2xl pointer-events-auto flex ring-1 ring-white/10 ${current.className}`}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              {current.icon}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-[9px] font-mono text-[var(--palantir-muted)] uppercase tracking-tighter">
                {current.prefix} // LOG_STREAM
              </p>
              <p className="mt-1 text-[11px] font-bold text-[var(--palantir-text)] uppercase tracking-tight">
                {message}
              </p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-white/5">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-sm p-4 flex items-center justify-center text-[10px] font-mono text-[var(--palantir-muted)] hover:text-[var(--palantir-text)] transition-colors"
          >
            ACK
          </button>
        </div>
      </div>
    ), { duration: 4000 });

    hasShown.current = true;
    onClose();
  }, [message, type, onClose]);

  return null;
}
