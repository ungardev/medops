// src/components/DeletePatientModal.tsx
import React, { useState } from "react";
import ReactDOM from "react-dom";

interface Props {
  open: boolean;
  patientName: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

export default function DeletePatientModal({ open, patientName, onConfirm, onClose }: Props) {
  const [confirmation, setConfirmation] = useState("");

  if (!open) return null;

  const handleDelete = () => {
    if (confirmation === "ELIMINAR") {
      onConfirm();
      setConfirmation("");
    }
  };

  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-danger">⚠️ Eliminar paciente</h3>
        <p>
          Estás a punto de eliminar al paciente{" "}
          <strong>{patientName}</strong>.  
          <br />
          Esta acción es irreversible.
        </p>
        <p className="mt-2">
          Para confirmar, escribe <strong>ELIMINAR</strong> en el campo de abajo:
        </p>

        <input
          className="input mt-2"
          placeholder="Escribe ELIMINAR para confirmar"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
        />

        <div className="modal-actions mt-3">
          <button
            className="btn btn-danger"
            onClick={handleDelete}
            disabled={confirmation !== "ELIMINAR"}
          >
            Eliminar definitivamente
          </button>
          <button className="btn btn-outline" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>,
    document.getElementById("modal-root")!
  );
}
