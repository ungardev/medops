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
export default function DeletePatientModal({ open, patientName, onClose }: Props) {
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
      title="ELIMINAR PACIENTE"
      subtitle="Confirmación de seguridad requerida"
      maxWidth="max-w-md"
    >
      <div className="px-6 py-5 border-b border-red-500/20 flex items-center justify-between bg-red-500/5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-500/10 rounded-xl text-red-500">
            <ExclamationTriangleIcon className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-red-500">
            Alerta de Seguridad
          </h3>
        </div>
      </div>
      <div className="p-8">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 bg-red-500/5 rounded-full flex items-center justify-center mb-4 border border-red-500/10">
            <TrashIcon className="w-8 h-8 text-red-500/40" />
          </div>
          <h4 className="text-xl font-semibold text-white mb-2 leading-tight">
            ¿Eliminar registro permanente?
          </h4>
          <p className="text-sm text-white/50 leading-relaxed">
            Estás a punto de eliminar al paciente: <br />
            <span className="text-white font-bold text-base block mt-2">
              {patientName}
            </span>
          </p>
        </div>
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 flex gap-3 items-start">
          <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 animate-pulse shrink-0" />
          <p className="text-sm text-red-400 leading-normal">
            Esta acción es irreversible. Se eliminarán todos los historiales y archivos asociados del servidor central.
          </p>
        </div>
      </div>
      <div className="px-6 py-5 bg-black/20 border-t border-red-500/10 flex flex-col gap-3">
        <button
          onClick={handleDelete}
          disabled={submitting}
          className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {submitting ? (
            <>
              <ArrowPathIcon className="w-5 h-5 animate-spin" />
              Eliminando...
            </>
          ) : (
            "Confirmar Eliminación"
          )}
        </button>
        
        <button
          onClick={() => !submitting && onClose()}
          disabled={submitting}
          className="w-full py-3 text-sm font-medium text-white/40 hover:text-white transition-colors"
        >
          Cancelar
        </button>
      </div>
    </EliteModal>
  );
}