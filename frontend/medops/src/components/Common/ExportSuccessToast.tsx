// src/components/Common/ExportSuccessToast.tsx
import React, { useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import type { GeneratedDocument } from "../../hooks/consultations/useGenerateConsultationDocuments";
import { 
  DocumentCheckIcon, 
  ArrowDownTrayIcon, 
  CheckCircleIcon,
  ForwardIcon 
} from "@heroicons/react/24/outline";

interface ExportSuccessToastProps {
  documents: GeneratedDocument[];
  skipped: string[];
  onClose: () => void;
}

const ExportSuccessToast: React.FC<ExportSuccessToastProps> = ({ documents, skipped, onClose }) => {
  const hasShown = useRef(false);

  useEffect(() => {
    if (hasShown.current) return;

    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-in fade-in slide-in-from-right-5' : 'animate-out fade-out slide-out-to-right-5'
        } max-w-md w-full bg-[#0a1a1a] border border-[var(--palantir-active)]/30 shadow-[0_0_20px_rgba(0,255,255,0.1)] pointer-events-auto flex flex-col`}
      >
        {/* HEADER: OPERACIÓN EXITOSA */}
        <div className="flex items-center justify-between px-4 py-2 bg-[var(--palantir-active)]/10 border-b border-[var(--palantir-active)]/20">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4 text-[var(--palantir-active)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--palantir-active)]">
              EXPORT_SEQUENCE_COMPLETE
            </span>
          </div>
          <span className="text-[8px] font-mono text-[var(--palantir-active)] opacity-50">
            STATUS: 200_OK
          </span>
        </div>

        {/* CONTENIDO: MANIFIESTO DE DOCUMENTOS */}
        <div className="p-4 space-y-3">
          {/* Documentos Generados */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <DocumentCheckIcon className="w-3 h-3 text-[var(--palantir-muted)]" />
              <span className="text-[8px] font-mono text-[var(--palantir-muted)] uppercase">Generated_Manifest:</span>
            </div>
            <ul className="space-y-1">
              {documents.map((doc, idx) => (
                <li key={idx} className="flex items-center gap-3 border-l border-[var(--palantir-active)]/40 pl-3 py-0.5">
                  <span className="text-[9px] font-black text-[var(--palantir-text)] uppercase tracking-tight w-16">
                    {doc.category}
                  </span>
                  <span className="text-[10px] font-mono text-[var(--palantir-active)] truncate">
                    {doc.title.toUpperCase().replace(/\s+/g, '_')}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Documentos Omitidos (Skipped) */}
          {skipped.length > 0 && (
            <div className="pt-2 border-t border-white/5">
              <div className="flex items-center gap-2 opacity-50">
                <ForwardIcon className="w-3 h-3 text-orange-400" />
                <span className="text-[8px] font-mono text-orange-400 uppercase">Skipped_Modules:</span>
              </div>
              <p className="mt-1 text-[9px] font-mono text-[var(--palantir-muted)] pl-5">
                {skipped.join(" // ").toUpperCase()}
              </p>
            </div>
          )}
        </div>

        {/* ACCIÓN DE CONFIRMACIÓN */}
        <div className="flex border-t border-white/10">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full py-3 flex items-center justify-center gap-2 bg-white/5 hover:bg-[var(--palantir-active)]/20 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--palantir-text)] transition-all"
          >
            <ArrowDownTrayIcon className="w-3 h-3" />
            Acknowledge_Receipt
          </button>
        </div>
      </div>
    ), { duration: 6000 });

    hasShown.current = true;
    onClose();
  }, [documents, skipped, onClose]);

  return null;
};

export default ExportSuccessToast;
