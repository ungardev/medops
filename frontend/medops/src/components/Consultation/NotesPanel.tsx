// src/components/Consultation/NotesPanel.tsx
import React, { useState } from "react";
import { useUpdateAppointmentNotes } from "../../hooks/appointments/useUpdateAppointmentNotes";

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
    <div className="rounded-lg shadow-lg p-4 bg-white dark:bg-gray-800">
      <h3 className="text-lg font-semibold text-[#0d2c53] dark:text-white mb-2">
        Notas Adicionales
      </h3>

      {readOnly && (
        <div className="mb-2">
          <p className="whitespace-pre-line text-[#0d2c53] dark:text-gray-300">
            {notes || "Sin notas registradas"}
          </p>
        </div>
      )}
            {!readOnly && !isEditing && (
        <div className="mb-2">
          <p className="whitespace-pre-line text-[#0d2c53] dark:text-gray-300">
            {value || "Sin notas registradas"}
          </p>
          <button
            className="px-4 py-2 rounded-md bg-gray-100 text-[#0d2c53] border border-gray-300 hover:bg-gray-200 transition-colors mt-2"
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
            rows={6}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm
                       bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100
                       focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isPending}
              className="px-4 py-2 rounded-md bg-[#0d2c53] text-white border border-[#0d2c53] hover:bg-[#0b2444] transition-colors"
            >
              {isPending ? "Guardando..." : "Guardar"}
            </button>
            <button
              onClick={() => {
                setValue(notes || "");
                setIsEditing(false);
              }}
              className="px-4 py-2 rounded-md bg-gray-100 text-[#0d2c53] border border-gray-300 hover:bg-gray-200 transition-colors"
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
