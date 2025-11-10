// src/components/Consultation/NotesPanel.tsx
import { useState } from "react";
import { useUpdateAppointmentNotes } from "../../hooks/appointments/useUpdateAppointmentNotes";

interface NotesPanelProps {
  appointmentId: number;
  notes: string | null;
}

export default function NotesPanel({ appointmentId, notes }: NotesPanelProps) {
  const [value, setValue] = useState(notes || "");
  const [isEditing, setIsEditing] = useState(false);

  const { mutate: updateNotes, isPending } = useUpdateAppointmentNotes();

  const handleSave = () => {
    if (value.trim() === "") return;
    updateNotes({ id: appointmentId, notes: value });
    setIsEditing(false);
  };

  return (
    <div className="notes-panel card">
      <h3 className="text-lg font-bold mb-2">Notas de evolución</h3>

      {!isEditing ? (
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
      ) : (
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
}
