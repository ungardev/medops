// src/components/Consultation/NotesPanel.tsx
import React, { useState } from "react";
import { useUpdateAppointmentNotes } from "../../hooks/appointments/useUpdateAppointmentNotes";

// 🔹 Exportamos la interfaz para index.ts
export interface NotesPanelProps {
  appointmentId?: number;   // opcional en modo readOnly
  notes: string | null;
  readOnly?: boolean;       // flag para modo lectura
}
const NotesPanel: React.FC<NotesPanelProps> = ({ appointmentId, notes, readOnly }) => {
  const [value, setValue] = useState(notes || "");
  const [isEditing, setIsEditing] = useState(false);

  const { mutate: updateNotes, isPending } = useUpdateAppointmentNotes();

  const handleSave = () => {
    if (!appointmentId || value.trim() === "") return;
    updateNotes(
      { id: appointmentId, notes: value },
      {
        onSuccess: (_data, variables) => {
          setValue(variables.notes);
          setIsEditing(false);
        },
      }
    );
  };

  return (
    <div className="notes-panel card">
      <h3 className="text-lg font-bold mb-2">Notas Adicionales</h3>

      {readOnly && (
        <div className="mb-2">
          <p className="whitespace-pre-line">
            {notes || "Sin notas registradas"}
          </p>
        </div>
      )}

      {!readOnly && !isEditing && (
        <div className="mb-2">
          <p className="whitespace-pre-line">
            {value || "Sin notas registradas"}
          </p>
          <button
            className="btn-secondary mt-2"
            onClick={() => setIsEditing(true)}
          >
            Editar notas
          </button>
        </div>
      )}

      {!readOnly && isEditing && (
        <div className="flex flex-col gap-2">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="textarea"
            rows={6}
          />
          <div className="flex gap-2">
            <button
              className="btn-primary"
              onClick={handleSave}
              disabled={isPending}
            >
              {isPending ? "Guardando..." : "Guardar"}
            </button>
            <button
              className="btn-secondary"
              onClick={() => {
                setValue(notes || "");
                setIsEditing(false);
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesPanel;
