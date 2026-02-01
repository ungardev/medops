// src/components/Patients/DeletePatientModal.tsx
import React, { useState } from "react";
import EliteModal from "../Common/EliteModal";
import { ExclamationTriangleIcon, TrashIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
interface Props {
  open: boolean;
  patientName: string | null;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}
export default function DeletePatientModal({ open, patientName, onConfirm, onClose }: Props) {
  const [submitting, setSubmitting] = useState(false);
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
  return (
    <EliteModal
      open={open}
      onClose={() => !submitting && onClose()}
      title="PATIENT_DELETION_PROTOCOL"
      subtitle="SECURITY_CONFIRMATION_REQUIRED"
      maxWidth="max-w-md"
      showDotIndicator={true}
    >
      {/* Header con tema rojo destructivo */}
      <div className="px-6 py-4 border-b border-red-500/20 flex items-center justify-between bg-red-500/5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
            <ExclamationTriangleIcon className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-red-500 uppercase tracking-[0.2em]">
            Alerta de Seguridad
          </h3>
        </div>
      </div>
      {/* Cuerpo del Mensaje - Preservado exactamente */}
      <div className="p-8">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 bg-red-500/5 rounded-full flex items-center justify-center mb-4 border border-red-500/10">
            <TrashIcon className="w-8 h-8 text-red-500/40" />
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
      {/* Acciones Críticas - Convertidas a estándar Elite */}
      <div className="px-6 py-4 bg-black/20 border-t border-red-500/10 flex flex-col gap-3">
        <button
          onClick={handleDelete}
          disabled={submitting}
          className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all font-mono flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {submitting ? (
            <>
              <ArrowPathIcon className="w-4 h-4 animate-spin" />
              DELETING_FROM_SYSTEM...
            </>
          ) : (
            "CONFIRM_DELETION_PROTOCOL"
          )}
        </button>
        
        <button
          onClick={() => !submitting && onClose()}
          disabled={submitting}
          className="w-full py-3 text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors font-mono"
        >
          ABORT_SECURITY_PROTOCOL
        </button>
      </div>
      {/* Footer Técnico - Preservado con estilos Elite */}
      <div className="px-4 py-2 bg-red-500/10 flex justify-between items-center border-t border-red-500/20">
        <span className="text-[8px] font-mono text-red-500/60 uppercase">Security_Protocol_404</span>
        <span className="text-[8px] font-mono text-red-500/60 uppercase tracking-[0.2em]">MedOpz_Kernel_Action</span>
      </div>
    </EliteModal>
  );
}