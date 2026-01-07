// src/components/Consultation/NotesPanel.tsx
import React, { useState } from "react";
import { useUpdateAppointmentNotes } from "../../hooks/appointments/useUpdateAppointmentNotes";
import { 
  DocumentTextIcon, 
  PencilSquareIcon, 
  CheckIcon, 
  XMarkIcon,
  CloudArrowUpIcon
} from "@heroicons/react/24/outline";

export interface NotesPanelProps {
  appointmentId?: number;
  notes: string | null;
  readOnly?: boolean;
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

  const handleCancel = () => {
    setValue(notes || "");
    setIsEditing(false);
  };

  return (
    <div className="border border-[var(--palantir-border)] bg-white/5 rounded-sm overflow-hidden transition-all">
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between bg-white/5 px-4 py-3 border-b border-[var(--palantir-border)]">
        <div className="flex items-center gap-2">
          <DocumentTextIcon className="w-4 h-4 text-[var(--palantir-active)]" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--palantir-text)]">
            Clinical_Observations
          </span>
        </div>
        
        {!readOnly && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 text-[9px] font-black uppercase text-[var(--palantir-active)] hover:opacity-80 transition-all"
          >
            <PencilSquareIcon className="w-3.5 h-3.5" />
            Edit_Notes
          </button>
        )}
      </div>

      <div className="p-4">
        {isEditing ? (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="relative">
              <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                rows={8}
                placeholder="Enter detailed clinical notes, patient history updates, or specific observations..."
                className="w-full bg-black/40 border border-[var(--palantir-border)] p-4 text-[11px] font-mono text-[var(--palantir-text)] focus:border-[var(--palantir-active)] outline-none resize-none leading-relaxed"
                autoFocus
              />
              <div className="absolute bottom-3 right-3 opacity-20 pointer-events-none">
                <DocumentTextIcon className="w-12 h-12" />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <span className="text-[8px] font-mono text-[var(--palantir-muted)] uppercase">
                {value.length} Characters_Recorded
              </span>
              
              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  disabled={isPending}
                  className="flex items-center gap-1 text-[9px] font-black uppercase text-[var(--palantir-muted)] hover:text-white transition-colors"
                >
                  <XMarkIcon className="w-3.5 h-3.5" /> 
                  Abort
                </button>
                <button
                  onClick={handleSave}
                  disabled={isPending}
                  className="flex items-center gap-2 bg-[var(--palantir-active)] hover:bg-blue-600 text-white px-4 py-2 text-[9px] font-black uppercase tracking-wider transition-all disabled:opacity-50"
                >
                  {isPending ? (
                    <>
                      <CloudArrowUpIcon className="w-3.5 h-3.5 animate-bounce" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="w-3.5 h-3.5" />
                      Commit_Observation
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative min-h-[120px]">
            {value ? (
              <p className="whitespace-pre-line text-[11px] font-mono leading-relaxed text-[var(--palantir-text)] opacity-90">
                {value}
              </p>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 border border-dashed border-[var(--palantir-border)] opacity-30">
                <DocumentTextIcon className="w-8 h-8 mb-2" />
                <span className="text-[9px] font-mono uppercase tracking-tighter">
                  No_Additional_Notes_Recorded
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FOOTER METADATA (Opcional, pero da el look Palantir) */}
      <div className="bg-black/20 px-4 py-2 flex items-center justify-between border-t border-[var(--palantir-border)]">
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${value ? 'bg-green-500' : 'bg-orange-500'} animate-pulse`} />
            <span className="text-[8px] font-mono text-[var(--palantir-muted)] uppercase">
              Status: {value ? 'Data_Locked' : 'Empty_Buffer'}
            </span>
          </div>
        </div>
        <span className="text-[8px] font-mono text-[var(--palantir-muted)]">
          ID: {appointmentId || 'UNSET'}
        </span>
      </div>
    </div>
  );
};

export default NotesPanel;
