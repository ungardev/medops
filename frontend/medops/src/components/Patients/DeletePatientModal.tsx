// src/components/Patients/DeletePatientModal.tsx
import React, { useState } from "react";
import ReactDOM from "react-dom";

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
    console.log("[MODAL] botón eliminar clicado"); // ⚔️ trazador
    if (submitting) return;
    setSubmitting(true);
    try {
      console.log("[MODAL] llamando onConfirm…");
      await onConfirm();
      console.log("[MODAL] onConfirm terminó");
    } catch (err) {
      console.error("[MODAL] error en onConfirm:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-2 sm:px-0"
      onClick={() => {
        console.log("[MODAL] overlay clicado");
        if (!submitting) onClose();
      }}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base sm:text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
          ⚠️ Eliminar paciente
        </h3>
        <p className="text-xs sm:text-sm text-[#0d2c53] dark:text-gray-300">
          Estás a punto de eliminar al paciente <strong>{patientName}</strong>.
          <br />
          Esta acción es irreversible.
        </p>

        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <button
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 text-xs sm:text-sm"
            onClick={handleDelete}
            disabled={submitting}
          >
            {submitting ? "Eliminando..." : "Eliminar"}
          </button>
          <button
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-md border border-gray-300 dark:border-gray-600
                       bg-gray-100 dark:bg-gray-700 text-[#0d2c53] dark:text-gray-200
                       hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-xs sm:text-sm"
            onClick={() => {
              console.log("[MODAL] cancelar clicado");
              if (!submitting) onClose();
            }}
            disabled={submitting}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>,
    document.getElementById("modal-root")!
  );
}
