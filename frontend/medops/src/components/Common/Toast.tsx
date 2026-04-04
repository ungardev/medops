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
    const config = {
      success: {
        icon: <CheckCircleIcon className="w-5 h-5 text-emerald-400" />,
        className: "border-l-4 border-emerald-500/50"
      },
      error: {
        icon: <ExclamationCircleIcon className="w-5 h-5 text-red-400" />,
        className: "border-l-4 border-red-500/50"
      },
      info: {
        icon: <InformationCircleIcon className="w-5 h-5 text-blue-400" />,
        className: "border-l-4 border-blue-500/50"
      }
    };
    const current = config[type] || config.info;
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-in fade-in slide-in-from-right-5' : 'animate-out fade-out slide-out-to-right-5'
        } max-w-md w-full bg-[#1a1a1b] shadow-2xl pointer-events-auto flex ring-1 ring-white/15 rounded-lg ${current.className}`}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              {current.icon}
            </div>
            <div className="ml-3 flex-1">
              <p className="mt-1 text-[12px] font-medium text-white/80">
                {message}
              </p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-white/10">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-[10px] text-white/30 hover:text-white/60 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    ), { duration: 4000 });
    hasShown.current = true;
    onClose();
  }, [message, type, onClose]);
  return null;
}