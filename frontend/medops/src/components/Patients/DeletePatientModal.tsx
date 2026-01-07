// src/components/Patients/DeletePatientModal.tsx
import React, { useState } from "react";
import ReactDOM from "react-dom";
import { AlertOctagon, Trash2, X, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  patientName: string | null;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export default function DeletePatientModal({ open, patientName, onConfirm, onClose }: Props) {
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleDelete = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onConfirm();
    } catch (err) {
      console.error("[MODAL] Error al eliminar:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center z-[1000] p-4 animate-in fade-in duration-300"
      onClick={() => !submitting && onClose()}
    >
      {/* Backdrop con desenfoque de peligro */}
      <div className="absolute inset-0 bg-red-950/20 backdrop-blur-md" />

      <div
        className="relative bg-[#11141a] border border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.2)] rounded-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera de Alerta */}
        <div className="px-6 py-4 border-b border-red-500/20 flex items-center justify-between bg-red-500/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
              <AlertOctagon size={20} />
            </div>
            <h3 className="text-sm font-bold text-red-500 uppercase tracking-[0.2em]">
              Alerta de Seguridad
            </h3>
          </div>
          <button 
            onClick={() => !submitting && onClose()}
            className="text-slate-500 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cuerpo del Mensaje */}
        <div className="p-8">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 bg-red-500/5 rounded-full flex items-center justify-center mb-4 border border-red-500/10">
                <Trash2 size={32} className="text-red-500/40" />
            </div>
            <h4 className="text-xl font-semibold text-white mb-2 leading-tight">
              ¿Eliminar registro permanente?
            </h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              Estás a punto de eliminar al paciente: <br />
              <span className="text-white font-bold text-lg block mt-2 underline decoration-red-500/50 underline-offset-4">
                {patientName}
              </span>
            </p>
          </div>

          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 flex gap-3 items-start">
             <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 animate-pulse shrink-0" />
             <p className="text-[11px] font-mono text-red-400 uppercase tracking-wider leading-normal">
                Esta acción es irreversible. Se eliminarán todos los historiales y archivos asociados del servidor central.
             </p>
          </div>
        </div>

        {/* Acciones Críticas */}
        <div className="px-8 py-6 bg-black/20 border-t border-red-500/10 flex flex-col gap-3">
          <button
            onClick={handleDelete}
            disabled={submitting}
            className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-bold uppercase tracking-widest transition-all shadow-lg shadow-red-900/40 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Eliminando del sistema...
              </>
            ) : (
              "Confirmar Eliminación"
            )}
          </button>
          
          <button
            onClick={() => !submitting && onClose()}
            disabled={submitting}
            className="w-full py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-white hover:bg-white/5 transition-all"
          >
            Cancelar y Abortar
          </button>
        </div>

        {/* Footer Técnico */}
        <div className="px-6 py-2 bg-red-500/10 flex justify-between items-center">
            <span className="text-[8px] font-mono text-red-500/60 uppercase">Security_Protocol_404</span>
            <span className="text-[8px] font-mono text-red-500/60 uppercase tracking-[0.2em]">MedOpz_Kernel_Action</span>
        </div>
      </div>
    </div>,
    document.getElementById("modal-root")!
  );
}
